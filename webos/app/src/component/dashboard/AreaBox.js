import styled from "styled-components";
import { DeviceCountBox } from "./DeviceCountBox";
import arrowRight from "../../assets/icon/arrowRight.png";
import edit from "../../assets/icon/edit.svg"
import trash from "../../assets/icon/trash.svg"
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { CheckDelete } from "../modal/CheckDelete";
import { updateAreaInfo } from "../../api/infomanageService";
import { AreaInfoInput } from "../modal/AreaInfoInput";

export const AreaBox = ({areaInfo, onEdit, onDelete}) => {
  const {name, description, sensorCount, actuatorCount, areaID} = areaInfo;
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [areaModalShow, setAreaModalShow] = useState(false);

  console.log(`${name} : ${areaID}`);

  return (
    <Container>
      <CheckDelete show = {showDelete}
                   setShow={setShowDelete}
                   onDelete={()=>{onDelete(areaID)}} />
      <AreaInfoInput show={areaModalShow} onSubmit={onEdit}
                     setShow={setAreaModalShow}
                     title={"구역 수정"}/>
      <AreaName>{name}</AreaName>
      <InputText>{description}</InputText>

      <DeviceWrap>
        <DeviceCountBox count={sensorCount} isSensor />
        <DeviceCountBox count={actuatorCount}/>
      </DeviceWrap>

      <ButtonWrap>
        <InfoEditWrap>
          <img src={edit} width={60} height={60} onClick={()=> {setAreaModalShow(true);}} />
          <img src={trash} width={60} height={60} onClick={()=> {setShowDelete(true);}} />
        </InfoEditWrap>
        <img src={arrowRight} width={80} height={80} onClick={()=> {navigate(`/devices/${areaID}`)}} />
      </ButtonWrap>
      
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 730px;
  height: 650px;
  background-color: #f5f5f5;
  padding: 30px 40px 20px 40px;
  border-radius: 20px;

  margin-top: 20px;

  &:active {
    opacity: 0.7;
  }
`;

const AreaName = styled.p`
  font-size: 64px;
  font-weight: 600;
`;

const InputText = styled.p`
  font-size: 40px;
  display: flex;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const DeviceWrap = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 20px 0px;
`;

const ButtonWrap = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const InfoEditWrap = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  & >  * {
    margin-left : 30px;
  }
`;