apt install python3.10-venv
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -r ./requirements.txt
pip install tesseract
pip3 install openpyxl
pip3 install pdftotext

apt install tesseract-ocr
apt install unrtf

export ELASTIC_END_POINT=""
export ELASTIC_CLOUD_ID=""
export ELASTIC_INDEX=""
export ELASTIC_USER_NAME=""
export ELASTIC_PASSWORD=""
export BUCKET_NAME=""
export AWS_ACCESS_KEY_ID=""
export AWS_SECRET_ACCESS_KEY=""

flask run
