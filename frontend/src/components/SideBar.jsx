import { Modal } from "@material-ui/core";
import { Upload, Button } from "antd";
import Add from "../assets/add.png";
import styled from "styled-components";

const SidebarContainer = styled.div`
  background: #FFFFFF;
  border-right: 1px solid lightgray;
`;

const SidebarBtn = styled.div`
  button {
    background: transparent;
    border: 1px solid lightgray;
    display: flex;
    align-items: center;
    border-radius: 50px;
    padding: 4px 7px;
    box-shadow: 1px 2px 1px #ccc;
    margin-left: 13px;
    span {
      font-size: 15px;
      margin-right: 10px;
      margin-left: 10px;
    }
  }
`;

const ModalPopup = styled.div`
  top: 50%;
  background-color: #fff;
  width: 500px;
  margin: 0px auto;
  position: relative;
  transform: translateY(-50%);
  padding: 10px;
  border-radius: 10px;
`;

const ModalHeading = styled.div`
  text-align: center;
  border-bottom: 2px solid lightgray;
  height: 40px;
`;

const ModalBody = styled.div`
  input.modal__submit {
    width: 100%;
    background: darkmagenta;
    padding: 10px 20px;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 5px;
    font-size: 16px;
    border: 0;
    outline: 0;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 20px;
    heigth: 20vh;
  }
  input.modal__file {
    background: whitesmoke;
    padding: 20px;
    color: #000;
    display: block;
    margin-top: 20px;
  }
`;

const UploadingPara = styled.p`
  background: green;
  color: #fff;
  margin: 20px;
  text-align: center;
  padding: 10px;
  letter-spacing: 1px;
`;

const UploadingParam = styled.p`
  color: #fff;
  margin: 20px;
  text-align: center;
  padding: 10px;
  letter-spacing: 1px;
`;

const Sidebar = ({
  handleSubmit,
  open,
  setOpen,
  loading,
  contextHolder,
  handleUploadChange,
  fileList,
}) => {
  return (
    <>
      {contextHolder}
      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalPopup>
          <ModalHeading>
            <p style={{ fontWeight: "500", marginTop: "10px" }}>
              Select file you want to upload
            </p>
          </ModalHeading>
          <ModalBody>
            {loading && <UploadingPara>Uploading...</UploadingPara>}
            {!loading && (
              <UploadingParam>
                <Upload
                  beforeUpload={() => false}
                  onChange={(info) => handleUploadChange(info.file)}
                  multiple={true}
                  // fileList={fileList}
                >
                  <Button type="dashed">Choose File...</Button>
                </Upload>
                {fileList?.name && fileList?.status !== "removed" && (
                  <Button
                    onClick={handleSubmit}
                    type="primary"
                    style={{ marginTop: "80px" }}
                  >
                    Submit
                  </Button>
                )}
              </UploadingParam>
            )}
          </ModalBody>
        </ModalPopup>
      </Modal>
      <SidebarContainer>
        <SidebarBtn style={{ marginTop: "25px" }}>
          <button style={{ cursor: "pointer" }} onClick={() => setOpen(true)}>
            <img style={{ height: "40px" }} alt="NewUplaod" src={Add} />
            <span>Upload</span>
          </button>
        </SidebarBtn>
      </SidebarContainer>
    </>
  );
};
export default Sidebar;
