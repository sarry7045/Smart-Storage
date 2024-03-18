import { useState, useEffect } from "react";
import GridOnIcon from "@material-ui/icons/GridOn";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import DnsIcon from "@material-ui/icons/Dns";
import styled from "styled-components";
import DeleteIcon from "@material-ui/icons/Delete";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import axios from "axios";
import { Modal } from "@material-ui/core";
import { Empty, Spin, message, Popconfirm, ConfigProvider } from "antd";

const DataContainer = styled.div`
  flex: 1 1;
  padding: 10px 0px 0px 20px;
`;

const DataHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid lightgray;
  height: 40px;
  .headerLeft {
    display: flex;
    align-items: center;
  }
  .headerRight svg {
    margin: 0px 10px;
  }
  .headerRight {
    display: flex;
    gap: 0.7rem;
    .sort-btn {
      padding: 0.4rem 0rem;
      border: none;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
    }
    .active {
      background-color: #67c6e3;
      color: #fff;
    }
  }
`;

const DataGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 30px;
  margin-bottom: 30px;
`;

const DataFile = styled.div`
  text-align: center;
  border: 1px solid rgb(204 204 204 / 46%);
  margin: 10px;
  min-width: 200px;
  padding: 10px 0px 0px 0px;
  border-radius: 5px;
  cursor: pointer;
  svg {
    font-size: 60px;
    color: gray;
  }
  p {
    border-top: 1px solid #ccc;
    margin-top: 5px;
    font-size: 12px;
    background: #dff5ff;
    padding: 10px 0px;
  }
`;

const DataListRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #ccc;
  padding: 10px;
  p {
    display: flex;
    align-items: center;
    font-size: 13px;
    b {
      display: flex;
      align-items: center;
    }
    svg {
      font-size: 22px;
      margin: 10px;
    }
  }
`;

const ModalPopup = styled.div`
  ${"" /* top: 50%; */}
  background-color: #fff;
  width: 500px;
  ${"" /* margin: 0px auto; */}
  ${"" /* position: relative; */}
  ${"" /* transform: translateY(-50%); */}
  ${"" /* padding: 10px; */}
  ${"" /* border-radius: 20px; */}
`;

const ModalHeading = styled.div`
  text-align: center;
  border-bottom: 2px solid lightgray;
  height: 40px;
`;

const Content = ({ searchableData }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [files, setFiles] = useState({});
  const [filesView, setFilesView] = useState(true);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [backUpFiles, setBackUpFiles] = useState([]);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");

  const vieww = () => {
    setLoading(true);
    setFilesView(!filesView);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const dataFetching = async () => {
    setLoading(true);
    try {
      const Response = await axios.get("http://3.220.41.62:5000/files");
      setFiles(Response?.data.data);
      setBackUpFiles(Response?.data.data);
      if (Response?.data) {
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    dataFetching();
  }, []);

  useEffect(() => {
    if (searchableData === null) {
      setFiles(backUpFiles);
    } else if (searchableData?.length === 0) {
      console.log("Error");
    } else {
      setFiles(searchableData);
    }
  }, [searchableData, backUpFiles]);

  function humanFileSize(size) {
    var i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    return (
      (size / Math.pow(1024, i)).toFixed(2) * 1 +
      " " +
      ["B", "kB", "MB", "GB", "TB"][i]
    );
  }

  const handleDelete = (fileName) => {
    const key = "updatable";
    axios
      .delete("http://3.220.41.62:5000/files", {
        data: { files: [fileName] },
        headers: { "Content-Type": "application/json" },
      })
      .then((Response) => {
        setFiles(files.filter((file) => file?.fileName !== fileName));
        if (Response.status === 200) {
          messageApi.open({
            key,
            type: "success",
            content: "Successfully Deleted",
            duration: 2,
          });
        }
      })
      .catch(() => {});
  };

  const handleOpenFiles = (fileName) => {
    setOpen(true);
    axios
      .get(`http://3.220.41.62:5000/file-url?filename=${fileName}`, {
        headers: "Access-Control-Allow-Origin: *",
      })
      .then((response) => {
        setFileUrl(response?.data.url);
        setFileName(response?.data.filename);
        setFileType(response?.data.type);
      })
      .catch(() => {});
  };

  const docs = [{ uri: fileUrl, fileName: fileName, fileType: fileType }];

  return (
    <>
      {contextHolder}
      <Modal
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        open={open}
        onClose={() => setOpen(false)}
      >
        <ModalPopup style={{ maxHeight: "90%", overflowY: "auto" }}>
          <ModalHeading>
            <p style={{ fontWeight: "500", marginTop: "10px" }}>Preview File</p>
          </ModalHeading>
          <div
            style={{ maxWidth: "100%", maxHeight: "100%", overflow: "auto" }}
          >
            {fileType === "PNG" ||
            fileType === "jpeg" ||
            fileType === "jpg" ||
            fileType === "bmp" ||
            fileType === "png" ||
            fileType === "tiff" ? (
              <img
                src={fileUrl}
                alt="ModalImage"
                style={{
                  width: "auto",
                  height: "auto",
                  maxHeight: "100%",
                  maxWidth: "100%",
                }}
              />
            ) : fileType === "mp3" ? (
              <div
                style={{
                  width: "50px",
                  height: "100px",
                }}
              >
                <audio style={{ padding: "20px", marginLeft: "75px" }} controls>
                  <source src={fileUrl} type="audio/mpeg" />
                </audio>
              </div>
            ) : (
              <DocViewer
                theme={{ primary: "#5296d8" }}
                pluginRenderers={DocViewerRenderers}
                documents={docs}
                style={{ width: 500, height: 500 }}
              />
            )}
          </div>
        </ModalPopup>
      </Modal>

      <DataContainer>
        <DataHeader>
          <div className="headerLeft">
            <p>My Files</p>
          </div>
          <div className="headerRight">
            <button
              title="Grid View"
              className={filesView ? "active sort-btn" : "sort-btn"}
              onClick={vieww}
            >
              <DnsIcon style={{ cursor: "pointer" }} fontSize="small" />
            </button>
            <button
              title="List View"
              className={!filesView ? "active sort-btn" : " sort-btn"}
              onClick={vieww}
            >
              <GridOnIcon style={{ cursor: "pointer" }} fontSize="small" />
            </button>
          </div>
        </DataHeader>

        {!loading && files.length > 0 ? (
          <div>
            {!filesView && (
              <DataGrid>
                {files?.map((file) => (
                  <DataFile onClick={() => handleOpenFiles(file?.fileName)}>
                    <InsertDriveFileIcon style={{ color: "378CE7" }} />
                    <p>
                      {file?.fileName} ({humanFileSize(file?.fileSize)})
                    </p>
                  </DataFile>
                ))}
              </DataGrid>
            )}

            {filesView && (
              <div style={{ marginTop: "10px" }}>
                <DataListRow>
                  <p style={{ marginLeft: "20px" }}>
                    <b>
                      Name
                      <ArrowDownwardIcon />
                    </b>
                  </p>
                  <p>
                    <b>Last Uploaded</b>
                  </p>
                  <p>
                    <b>File Size</b>
                  </p>
                  <p>
                    <b></b>
                  </p>
                </DataListRow>
                <div style={{ overflow: "auto", height: "100%" }}>
                  {files?.map((file) => (
                    <DataListRow>
                      <p
                        style={{ color: "#378CE7", cursor: "pointer" }}
                        onClick={() => handleOpenFiles(file?.fileName)}
                      >
                        <InsertDriveFileIcon />
                        {file?.fileName}
                      </p>
                      <p
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        {file?.createdOn}
                      </p>
                      <p>{humanFileSize(file?.fileSize)}</p>
                      <p>
                        <ConfigProvider>
                          <Popconfirm
                            onConfirm={() => handleDelete(file?.fileName)}
                            placement="left"
                            title={"Are you sure want to delete ?"}
                            okText="Yes"
                            cancelText="No"
                          >
                            <DeleteIcon
                              style={{
                                height: "20px",
                                color: "#FF204E",
                                cursor: "pointer",
                              }}
                            />
                          </Popconfirm>
                        </ConfigProvider>
                      </p>
                    </DataListRow>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : loading ? (
          <Spin style={{ marginTop: "200px" }} tip="Loading..." size="large">
            <div className="content" />
          </Spin>
        ) : (
          files.length < 1 && <Empty style={{ marginTop: "200px" }} />
        )}
      </DataContainer>
    </>
  );
};
export default Content;
