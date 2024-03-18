import datetime
import json
import time
import traceback
import uuid
from multiprocessing import Process
from flask import Flask, request
import textract
import os
from werkzeug.utils import secure_filename
from elasticsearch import Elasticsearch
import re
import boto3
from flask import Response
from excel_parser import extract

# pip install tesseract # for image
# sudo apt install tesseract-ocr

UPLOAD_FOLDER = './temp/'

ELASTIC_END_POINT = os.environ['ELASTIC_END_POINT']
ELASTIC_CLOUD_ID = os.environ['ELASTIC_CLOUD_ID']
ELASTIC_INDEX = os.environ['ELASTIC_INDEX']
ELASTIC_PASSWORD = os.environ['ELASTIC_PASSWORD']
BUCKET_NAME = os.environ['BUCKET_NAME']
DEFAULT_USER_ID = 'joyboy'
S3_PREFIX = ''
DATE_FORMATE = '%Y-%m-%d %H:%M:%S'

# Create the client instance
es_client = Elasticsearch(
    cloud_id=ELASTIC_CLOUD_ID,
    basic_auth=(os.environ['ELASTIC_USER_NAME'], ELASTIC_PASSWORD)
)

s3 = boto3.client('s3', region_name='us-east-1', aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                  aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])

app = Flask(__name__)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


class ValidationException(Exception):
    def __init__(self, message):
        self.message = message


def _generate_error_response(message, status):
    return _generate_http_response({'message': message}, status)


def _generate_http_response(response_body, status):
    return Response(json.dumps(response_body), status=status, mimetype='application/json')


def _get_current_time():
    return datetime.datetime.fromtimestamp(time.time()).strftime(DATE_FORMATE)


def _timestamp_to_format(_timestamp):
    # Convert epoch timestamp to a datetime object in UTC
    timestamp_datetime_utc = datetime.datetime.utcfromtimestamp(_timestamp)

    return timestamp_datetime_utc.strftime(DATE_FORMATE)


def _get_user_id(_request):
    if 'userId' in _request.args:
        return _request.args.get('userId')
    return DEFAULT_USER_ID


def _create_elastic_record(document):
    base_url = ELASTIC_END_POINT
    existing_record = _get_elastic_record_by_file_name(document['userId'], document['fileName'])
    request_url = f'{base_url}/{ELASTIC_INDEX}/'
    print(f'request_url {request_url}')

    if existing_record['hits']['total']['value'] > 0:
        doc_id = existing_record['hits']['hits'][0]['_id']
        document = {'doc': document}
        print(f"updating record for id: {doc_id}")
        response = es_client.update(index=ELASTIC_INDEX, id=doc_id, body=document)
    else:
        doc_id = str(uuid.uuid4())
        print(f"creating record with id: {doc_id}")
        document['cleanFileName'] = re.sub('[^0-9a-zA-Z]+', ' ', document['fileName'])
        response = es_client.create(index=ELASTIC_INDEX, id=doc_id, body=document)

    print(f'elastic create index response: {response}')


def _get_elastic_record_by_file_name(user_id, file_name):
    query = {
        "query": {
            "bool": {
                "must": [{"term": {"userId": user_id}},
                         {"term": {"fileName": file_name}}]
            }
        }
    }

    print(f'Sending search query: {query}')
    response = es_client.search(index=ELASTIC_INDEX, body=query)
    # print(response)
    return response


def _create_search_response(result):
    if result is None or len(result) == 0:
        return []
    response = []
    for res in result:
        response.append({
            'userId': res['_source'].get('userId', ''),
            'fileName': res['_source'].get('fileName', ''),
            'filePath': res['_source'].get('filePath', ''),
            'createdOn': res['_source'].get('createdOn', '')
        })
    return response


def _search_files(user_id, must: list, must_not: list, file_name: bool, file_content: bool) -> list:
    query = {
        "query": {
            "bool": {
                "must": [],
                "must_not": []
            }
        }
    }

    query['query']['bool']['must'].append({"bool": {"should": []}})
    query['query']['bool']['must'].append({"match": {"userId": user_id}})
    for m in must:
        if file_name:
            query['query']['bool']['must'][0]['bool']['should'].append({"match": {"cleanFileName": m}})
        if file_content:
            query['query']['bool']['must'][0]['bool']['should'].append({"match": {"fileText": m}})

    for m in must_not:
        if file_name:
            query['query']['bool']['must_not'].append({"match": {"cleanFileName": m}})
        if file_content:
            query['query']['bool']['must_not'].append({"match": {"fileText": m}})

    print(f'search query: {query}')

    response = es_client.search(index=ELASTIC_INDEX, body=query, source_excludes=["fileText"])
    print(response['hits']['total']['value'])
    return _create_search_response(response['hits']['hits'])


def _file_to_text(file_path):
    if file_path.endswith('xls') or file_path.endswith('xlsx'):
        data = extract(file_path)
    else:
        data = textract.process(file_path)
    data = data.decode("utf-8")
    if data:
        data = data.encode("ascii", "ignore")
        data = data.decode() if data else ''
        data = data.strip()
        # replace multiple spaces, new lines or tabs with single space
        data = ' '.join(data.split(None))  # re.sub(' +', ' ', data)
        data = data.replace('\n', ' ').replace('\r', '')
    else:
        data = ''
    # print(data)
    return data


# async task
def _post_process_file(user_id, file_name, relative_path):
    full_file_path = os.path.abspath(relative_path)
    file_size = os.path.getsize(full_file_path)
    print(f'processing file: {full_file_path}')
    data = _file_to_text(full_file_path)
    date = _get_current_time()
    document = {
        'userId': user_id,
        'fileText': data,  # 'joyboy has returned'
        'fileName': file_name,
        'filePath': '/',
        'fileSize': file_size,
        'createdOn': date,
        'updatedOn': date
    }

    try:
        print(f'updating elastic search for file: {file_name}')
        _create_elastic_record(document)
    except Exception as _: # noqa
        traceback.print_exc()

    try:
        print(f'deleting file: {file_name}')
        os.remove(full_file_path)
    except Exception as _: # noqa
        traceback.print_exc()


def _upload_file(user_id, file):
    filename = secure_filename(file.filename)
    key = f'{S3_PREFIX}{user_id}/{filename}'
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    with open(file_path, "rb") as f:
        s3.put_object(
            Body=f.read(),
            Bucket=BUCKET_NAME,
            Key=key,
            ContentType='application/x-www-form-urlencoded',
            Metadata={
                'user_id': user_id,
                'created_on': _get_current_time()
            }
        )


def _delete_s3_file(file_path):
    print(f"deleting file from S3: {file_path}")
    try:
        s3.delete_object(
            Bucket=BUCKET_NAME,
            Key=file_path
        )
        return True
    except Exception as e:
        print(f'something went wrong while deleting s3 file: {e}')
        return False


def _delete_elastic_record(user_id, file):
    print(f"deleting file from elastic search: {file} user: {user_id}")
    try:
        query = {
            "query": {
                "bool": {
                    "must": [{"term": {"userId": user_id}},
                             {"term": {"fileName": file}}]
                }
            }
        }

        es_client.delete_by_query(index=ELASTIC_INDEX, body=query)
        return True
    except Exception as e:
        print(f'something went wrong while deleting elastic record: {e}')
        return False


def _delete_file(user_id, file):
    print(f'deleting file: {file}')

    es_deleted = _delete_elastic_record(user_id, file)
    s3_deleted = False
    if es_deleted:
        s3_deleted = _delete_s3_file(f'{S3_PREFIX}{user_id}/{file}')
    return es_deleted and s3_deleted


@app.route('/files', methods=['GET', 'POST', 'DELETE'])
def upload():
    if request.method == 'GET':
        user_id = _get_user_id(request)
        start_from = request.args.get('start')
        if start_from:
            start_from = start_from.split('#')
            start_from[0] = _timestamp_to_format(int(start_from[0]) / 1000)
        print(start_from)
        response = []
        last_key = None
        query = {
            "query": {
                "bool": {
                    "must": [{"term": {"userId": user_id}}]
                }
            },
            "sort": [
                {"createdOn": "desc"},
                {"fileName": "asc"}
            ],
            "size": 10
        }
        if start_from is not None and len(start_from) > 0:
            query['search_after'] = start_from

        print(f'query: {query}')

        es_response = es_client.search(index=ELASTIC_INDEX, body=query, source_excludes=["fileText"])
        print(f"response size: {es_response['hits']['total']['value']}")

        for res in es_response['hits']['hits']:
            temp = {
                'fileName': res['_source']['fileName'],
                'filePath': res['_source']['filePath'],
                'createdOn': res['_source']['createdOn'],
                'updatedOn': res['_source']['updatedOn'],
                'fileSize': res['_source']['fileSize']
            }
            response.append(temp)
            last_key = res['sort']

        return {'data': response, 'lastKey': last_key}

    if request.method == 'POST':
        user_id = _get_user_id(request)
        # check if the post request has the file part
        print(os.getcwd())
        print(request.files)
        if 'file' not in request.files:
            print('No file part')
            return 'fail'

        for file in request.files.getlist('file'):
            # if user does not select file, browser also
            # submit an empty part without filename
            if file.filename == '':
                print('No selected file')
                continue
            if file:
                try:
                    _upload_file(user_id, file)

                    p = Process(target=_post_process_file,
                                args=(user_id, file.filename, app.config['UPLOAD_FOLDER'] + file.filename,))
                    p.start()
                except Exception as _:  # noqa
                    traceback.print_exc()
        return 'success'
    if request.method == 'DELETE':
        body = request.get_json()
        print(body)
        if 'files' not in body or not isinstance(body['files'], list):
            return _generate_error_response('invalid request', 400)
        user_id = _get_user_id(request)
        deleted = []
        not_deleted = []
        for file in body['files']:
            is_file_deleted = _delete_file(user_id, file)
            if is_file_deleted:
                deleted.append(file)
            else:
                not_deleted.append(file)
        return {'deleted': deleted, 'notDeleted': not_deleted}


@app.route('/search', methods=['POST'])
def search():
    if request.method == 'POST':
        data = request.get_json()
        print(data)
        user_id = _get_user_id(request)
        file_name = data['fileName'] if 'fileName' in data else True
        file_content = data['fileContent'] if 'fileContent' in data else True
        if not file_content and not file_name:
            file_content = True
            file_name = True

        return _search_files(user_id, data.get('must', []), data.get('mustNot', []), file_name, file_content)


@app.route('/file-url', methods=['GET'])
def get_file_pre_signed_url():
    if request.method == 'GET':
        user_id = _get_user_id(request)
        prefix = f'{S3_PREFIX}{user_id}'
        filename = request.args.get('filename')
        print(filename)
        params = {
            'Bucket': BUCKET_NAME,
            'Key': f'{prefix}/{filename}'
        }
        print(params)
        url = s3.generate_presigned_url(
            ClientMethod='get_object',
            Params=params,
            ExpiresIn=3600
        )

        return {'url': url}


if __name__ == '__main__':
    app.run(debug=True)
