import React, { useState } from "react";
import Content from "./components/Content";
import Navbar from "./components/Navbar";
import Sidebar from "./components/SideBar";
import { message } from "antd";
import axios from "axios";

const App = () => {
  // Navbar Flow
  const [searchableData, setSearchableData] = useState([]);
  const [excludeText, setExcludeText] = useState("");

  const [state, setState] = useState({
    checkedA: true,
    checkedB: true,
  });

  const handleChange = (event) => {
    setState({ ...state, [event.target.name]: event.target.checked });
  };

  const notFound = () => {
    message.info("No Result found!");
  };

  const handleExcludeSearch = (e) => {
    setExcludeText(e.target.value.toLowerCase());
  };

  const handleSearchChange = async (e) => {
    if (e.target.value === "") {
      setSearchableData(null);
      return;
    }
    const SearchObject = {
      must: e.target.value.split(" "),
      mustNot: [excludeText],
      fileContent: state.checkedB,
      fileName: state.checkedA,
    };
    if (e.key === "Enter") {
      axios
        .post("http://3.220.41.62:5000/search", SearchObject)
        .then((Response) => {
          setSearchableData(Response.data.data);
          if (Response.data.data.length === 0) {
            notFound();
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };
  // Navbar Flow

  //Sidebar Flow
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [fileList, setFileList] = useState(null);
  const [open, setOpen] = useState(false);

  const handleUploadChange = (file) => {
    setFileList(file);
  };

  const success = () => {
    messageApi.open({
      type: "success",
      content: "File Uploaded Successfully",
      duration: 2,
    });
  };

  const error = () => {
    messageApi.open({
      type: "error",
      content: "Something Went Wrong",
      duration: 2,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", fileList);
    axios
      .post("http://3.220.41.62:5000/files", formData)
      .then(() => {
        window.location.reload();
      })
      .catch(() => {
        error();
      });
    setTimeout(() => {
      success();
      setLoading(false);
      setOpen(false);
      setFileList([]);
    }, 1000)
  };
  //Sidebar Flow

  return (
    <>
      <Navbar
        handleSearchChange={handleSearchChange}
        handleExcludeSearch={handleExcludeSearch}
        handleChange={handleChange}
        state={state}
        excludeText={excludeText}
      />
      <div className="App">
        <Sidebar
          handleSubmit={handleSubmit}
          open={open}
          setOpen={setOpen}
          loading={loading}
          contextHolder={contextHolder}
          handleUploadChange={handleUploadChange}
          fileList={fileList}
        />
        <Content searchableData={searchableData} />
      </div>
    </>
  );
};

export default App;

// npm unimported
