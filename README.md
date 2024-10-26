# 2024ESWContest_webOS_AgriTalk 🌱

## Links

### firmware-Github
[![GitHub](https://img.shields.io/badge/GITHUB-000000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/roll4ward/ESWContest-ThreadModule) 

### Others
[![YouTube](https://img.shields.io/badge/YOUTUBE-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/KivOYPYOhD8) [![PowerPoint](https://img.shields.io/badge/POWERPOINT-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white)](https://docs.google.com/presentation/d/1gpYKtbu3-wTxwrp7OETVl8aiAA4hDhQ9/edit?usp=sharing&ouid=100062750372709514654&rtpof=true&sd=true)

## 목차 📋
- [프로젝트 소개](#프로젝트-소개)
- [주요 기능](#주요-기능)
- [파일 구조](#파일-구조)
- [개발 일정](#개발-일정)
- [기술 스택](#기술-스택)
- [팀 소개](#팀-소개)

---

# 프로젝트 소개 🧑‍🌾

**농담(AgriTalk)** 프로젝트는 2024 임베디드 소프트웨어 경진대회의 일환으로 개발되었습니다.

'**농담**'은 농업의 '**농(農)**'과 이야기의 '**담(談)**'을 결합한 이름입니다. AI와의 대화를 통해 농업 서비스를 쉽고 친근하게 제공하겠다는 의미를 담고 있습니다.

이 프로젝트는 **webOS**를 기반으로 한 스마트 농업 시스템을 구축하는 것을 목표로 하고 있습니다. 시스템은 **webOS**, **GPT-4o**, **OpenThread** 프로토콜 및 다양한 **JS 서비스**를 통합하여 농부들이 농업 장비를 모니터링하고 제어할 수 있도록 지원합니다.

AI와 고급 통신 프로토콜을 활용하여 사용자와 농업 장비 간의 실시간 상호작용을 가능하게 하며, 이를 통해 자동화와 운영 효율성을 크게 향상시킵니다.




<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">

   ### [데이터 관리 섹션] 
   <img src="https://github.com/user-attachments/assets/39e55fd6-4a34-439a-82d2-56a75a280a54" alt="image1" style="width:40%; height:auto; max-width:200px;">
   <img src="https://github.com/user-attachments/assets/ff953767-5ead-4d15-a0b6-56140cf86dbb" alt="image2" style="width:40%; height:auto; max-width:200px;">

   ### [AI와 대화하기 섹션] 
   <img src="https://github.com/user-attachments/assets/27ec0538-452f-4736-95a8-a0f98af421cc" alt="image4" style="width:40%; height:auto; max-width:200px;">
   <img src="https://github.com/user-attachments/assets/9339930a-0e3c-471c-aae0-7d304e29e951" alt="image3" style="width:40%; height:auto; max-width:200px;">
   
</div>

## 주요 기능 🛠️
- **음성 인식 및 제어**: 음성을 통해 농업 장비를 제어하고 다양한 작업을 수행할 수 있습니다.
- **실시간 데이터 모니터링**: 센서를 통해 실시간으로 농업 데이터를 모니터링하고 분석합니다.
- **스마트 농업 자동화**: AI를 통해 농업 장비를 자동으로 제어하고 최적화된 작업을 수행합니다.


---

# 파일 구조📂
📦 webos  
├── 📂 app  
│   ├── 📂 api  
│   │   ├── 📜 aiService.js  
│   │   ├── 📜 camera.js  
│   │   ├── 📜 coapService.js  
│   │   ├── 📜 infomanage.js  
│   │   ├── 📜 mediaService.js  
│   │   ├── 📜 newDevice.js  
│   │   ├── 📜 serviceUtils.js  
│   │   └── 📜 toast.js  
│   ├── 📂 assets  
│   ├── 📂 component  
│   └── 📂 page  
├── 📂 service  
│   ├── 📂 aitalk  
│   │   ├── 📜 audioCon.py  
│   │   ├── 📜 config.json  
│   │   ├── 📜 dto.js  
│   │   └── 📜 service.js  
│   ├── 📂 infomanage  
│   │   ├── 📜 ble_info.json  
│   │   ├── 📜 service.js  
│   │   ├── 📜 device.js  
│   │   ├── 📜 area.js  
│   │   └── 📜 newDevice.js  
│   ├── 📂 coap  
│   │   └── 📜 service.js  
│   └── 📂 infomedia  
│       ├── 📜 imageCon.py  
│       └── 📜 service.js  
└── 📂 wpantund  
    └── 📜 bblayers.conf  

---


# 개발 일정 📅
<img src="https://github.com/user-attachments/assets/90e01838-fe1f-432b-8ba5-92271b3ea791" alt="개발 일정" width="500px" />

---


# 기술 스택 🛠️


| Area          | Stack & Tool |
|---------------|--------------|
| **Language**  | ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![C](https://img.shields.io/badge/C-A8B9CC?style=for-the-badge&logo=c&logoColor=white) |
| **Front end**  | ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) |
| **Back end**  | ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) |
| **Platform**  | ![webOS](https://img.shields.io/badge/webOS-FF3366?style=for-the-badge&logo=webos&logoColor=white) ![OpenAI API](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white) |
| **Protocol**  | ![Thread](https://img.shields.io/badge/Thread-000000?style=for-the-badge&logo=thread&logoColor=white) ![CoAP](https://img.shields.io/badge/CoAP-005571?style=for-the-badge&logo=coap&logoColor=white) |
| **Network**   | ![wpantund](https://img.shields.io/badge/wpantund-00ADEF?style=for-the-badge&logo=thread&logoColor=white) |
| **Cooperation**  | ![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white) ![Notion](https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white) ![Figma](https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white) |



---


# 팀 소개 👥

| 구분   | 성명    | 소속        | 역할                       |
|--------|---------|-------------|-----------------------------|
| 팀장   | 이준희  | 한양대학교   | Firmware                    |
| 팀원   | 김준호  | 상명대학교 | AI Backend                  |
| 팀원   | 황건하  | 상명대학교 | Thread Protocol Development |
| 팀원   | 유승혜  | 브로제이                 | Web App Development         |
| 팀원   | 이수민  | 인하대학교      | Web App Development         |

