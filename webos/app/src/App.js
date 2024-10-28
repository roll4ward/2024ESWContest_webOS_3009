import logo from "./logo.svg";
import "./App.css";
import GlobalStyle from "./globalStyle";
import "bootstrap/dist/css/bootstrap.min.css";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import ChatPage from "./page/chat";
import { Camera } from "./page/Camera";
import { Home } from "./page/Home";
import DeviceDetailPage from "./page/DeviceDetailPage";
import { DeviceOverView } from "./page/DeviceOverView";
import { SideBar } from "./component/SideBar";
import GalleryPreviewPage from "./page/GalleryPreviewPage";
import { useEffect } from "react";
import { initRecord } from "./api/mediaService";
import { useRecordStore } from "./store/useRecordStore";
import { startSending } from "./api/coapService";

function App() {
  const recorderId = useRecordStore((state) => state.recorderId);
  const setRecorderId = useRecordStore((state) => state.setRecorderId);

  useEffect(() => {
    if (!recorderId) {
      initRecord((result) => {
        setRecorderId(result);
        console.log("first record :" , result);
      });
    }

    startSending(300, (result) => {
      if (result) {
        console.log(`CoAP Sending 시작 interval : 5min`);
      }

      else {
        console.log("CoAP Sending 실패");
      }
    });
  }, []);

  return (
    <Router>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          height: "100vh",
          width: "1920px",
          padding: "25px",
        }}
      >
        {/* 사이드 메뉴 */}
        <div style={{ width: "250px", height: "100%" }}>
          <SideBar />
        </div>

        {/* 콘텐츠 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto", // 세로 스크롤 적용
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/camera" element={<Camera />} />
            <Route path="/gallery" element={<GalleryPreviewPage />} />
            <Route path="/devices/:areaID" element={<DeviceOverView />} />
            <Route path="/detail/:deviceID" element={<DeviceDetailPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
