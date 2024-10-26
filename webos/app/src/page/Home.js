import styled from "styled-components";
import add from "../assets/icon/add.png";
import { AreaBox } from "../component/dashboard/AreaBox";
import { createArea, deleteArea, readAllAreas, updateAreaInfo } from "../api/infomanageService";
import { useEffect, useState } from "react";
import { AreaInfoInput } from "../component/modal/AreaInfoInput";
import { createToast } from "../api/toast";

export const Home = () => {
  const [areas, setAreas] = useState([]);
  const [areaModalShow, setAreaModalShow] = useState(false)

  useEffect(()=> {
    loadAllAreas();
  }, []);

  function onAreaCreate(name, description) {
    if(!name) return;
    createArea(name, description, (result) => {
      console.log("Area Created : ", result);
      createToast("구역이 생성되었습니다.");
      loadAllAreas();
    })
    console.log(`${name} : ${description} Create`);
  }

  function onAreaEdit(areaID, name, description) {
    if(!name) return;
    updateAreaInfo(areaID, name, description, (result) => {
      console.log("Area updated : ", result);
      createToast("구역 정보가 수정되었습니다.");
      loadAllAreas();
    })
  }

  function onAreaDelete(areaID) {
    deleteArea(areaID, (result) => {
      if (!result) {
        createToast("구역에 속한 기기가 있어 구역을 삭제할 수 없습니다.");
        return;
      }

      createToast("구역이 삭제되었습니다.");
      loadAllAreas();
    })
  }

  function loadAllAreas() {
    readAllAreas((result) => {
      console.log(result);
      setAreas(result);
    });
  }

  return (
    <Container>
      <AreaInfoInput setShow={setAreaModalShow}
                     show={areaModalShow} onSubmit={onAreaCreate}
                     title={"구역 추가"} target={"구역"}/>
      <TextWrap>
        <Title>{"안녕하세요,"}</Title>
        <SubTitleWrap>
          <Text>
            {"든든한 농업 파트너 "}
            <span>농담</span>
            입니다.
          </Text>
        </SubTitleWrap>
      </TextWrap>

      <ButtonConatiner>
        <Button onClick={()=>{setAreaModalShow(true)}}>
          <img src={add} alt="" width={48} height={48} />
          {"구역 추가"}
        </Button>
      </ButtonConatiner>

    <DataContainer>
      {areas.length < 1 ? (
        <NoDataText>구역을 추가해 주세요</NoDataText>
      ) : (
        areas.map((area) => 
          <AreaBox areaInfo={area} onDelete={onAreaDelete} onEdit={onAreaEdit.bind(null, area.areaID)}/>
        )
      )}
    </DataContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  padding: 0px 60px;
`;

const TextWrap = styled.div`
  justify-content: flex-start;
  display: flex;
  flex-direction: column;
`;
const SubTitleWrap = styled.div`
  display: flex;
  flex-direction: row;
`;

const Title = styled.p`
  font-size: 75px;
  color: #448569;
  font-weight: 700;
`;

const Text = styled.p`
  font-size: 64px;
  margin: 5px 0;

  & > span {
    font-size: 64px;
    color: #448569;
    font-weight: 700;
  }
`;

const Button = styled.button`
  background-color: #448569;
  width: 266px;
  height: 83px;
  border-width: 0;
  border-radius: 20px;
  font-size: 40px;
  font-weight: 700;
  flex-direction: row;
  color: #ffff;
  align-items: center;
  justify-content: center;

  &:active {
    opacity: 0.7;
  }
`;

const ButtonConatiner = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
`;

const DataContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`

const NoDataText = styled.span`
  display: flex;
  font-size: 50px;
  color: #4c4c4c;
  width: 100%;
  justify-content: center;
`;
