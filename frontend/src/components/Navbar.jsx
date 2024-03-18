import { useState } from "react";
import styled from "styled-components";
import SearchIcon from "@material-ui/icons/Search";
import FormatAlignCenterIcon from "@material-ui/icons/FormatAlignCenter";
import { SearchOutlined } from "@ant-design/icons";
import { Avatar, Modal } from "@material-ui/core";
import { Input, Space } from "antd";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Logo from "../assets/Logo.png";

const HeaderContainer = styled.div`
  display: grid;
  grid-template-columns: 238px auto 200px;
  align-items: center;
  padding: 5px 20px;
  height: 60px;
  overflow: auto;
  border-bottom: 1px solid lightgray;
`;

const HeaderLogo = styled.div`
  display: flex;
  align-items: center;
  img {
    width: 35px;
  }
  span {
    font-size: 20px;
    margin-left: 10px;
    color: gray;
  }
`;

const HeaderSearch = styled.div`
  display: flex;
  align-items: center;
  width: 600px;
  background-color: #dddddd;
  padding: 8px;
  border-radius: 15px;
  input {
    background-color: transparent;
    border: 0;
    outline: 0;
    flex: 1;
  }
`;

const HeaderIcons = styled.div`
  display: flex;
  align-items: center;
  span {
    display: flex;
    align-items: center;
    margin-left: 150px;
  }
  svg.MuiSvgIcon-root {
    margin: 0px 10px;
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

const ModalHeading = styled.div`
  text-align: center;
  border-bottom: 2px solid lightgray;
  height: 40px;
`;

const UploadingParam = styled.p`
  color: #fff;
  margin: 20px;
  text-align: center;
  padding: 10px;
  letter-spacing: 1px;
`;

const Navbar = ({
  handleSearchChange,
  handleExcludeSearch,
  excludeText,
  handleChange,
  state,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalPopup>
          <ModalHeading>
            <p style={{ fontWeight: "500", marginTop: "10px" }}>
              Apply Advance Filter
            </p>
          </ModalHeading>
          <ModalBody>
            <UploadingParam>
              <label style={{ color: "black", fontWeight: "500" }}>
                Exclude:
              </label>
              <Space.Compact size="medium" style={{ marginLeft: "15px" }}>
                <Input
                  value={excludeText}
                  onChange={handleExcludeSearch}
                  addonBefore={<SearchOutlined />}
                  placeholder="Search here..."
                />
              </Space.Compact>
            </UploadingParam>

            <UploadingParam>
              <FormControlLabel
                style={{ color: "black" }}
                control={
                  <Checkbox
                    checked={state.checkedA}
                    onChange={handleChange}
                    name="checkedA"
                    color="primary"
                  />
                }
                label="FileName"
              />
              <FormControlLabel
                style={{ color: "black" }}
                control={
                  <Checkbox
                    checked={state.checkedB}
                    onChange={handleChange}
                    name="checkedB"
                    color="primary"
                  />
                }
                label="FileContent"
              />
            </UploadingParam>
          </ModalBody>
        </ModalPopup>
      </Modal>

      <HeaderContainer>
        <HeaderLogo>
          <img src={Logo} alt="Smart Storage" />
          <span>Smart Storage</span>
        </HeaderLogo>
        <HeaderSearch>
          <SearchIcon />
          <input
            style={{ marginLeft: "10px" }}
            type="text"
            placeholder="Search in Drive"
            onKeyDown={handleSearchChange}
          />
          <FormatAlignCenterIcon
            titleAccess="Advance Filter"
            style={{ cursor: "pointer" }}
            onClick={() => setOpen(true)}
          />
        </HeaderSearch>
        <HeaderIcons>
          <span>
            <Avatar
              title="Profile"
              style={{
                backgroundColor: "#67C6E3",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <p style={{ fontSize: "16px" }}>SY</p>
            </Avatar>
          </span>
        </HeaderIcons>
      </HeaderContainer>
    </>
  );
};

export default Navbar;
