import styled from "styled-components"
import { ModalBase } from "./ModalBase"
import { useRef } from "react"


export const AreaCreate = ({show, setShow, onCreate}) => {
    const name = useRef({
        value: ""
    });
    const description = useRef({
        value: ""
    });

    return (
        <ModalBase show={show}>
            <Container>
                <Title>구역 추가</Title>
                <Label>구역 이름</Label>
                <Input ref={name}></Input>
                <Label>구역 설명</Label>
                <Input ref={description}></Input>
                <ButtonWrap>
                    <Button onClick={()=>{setShow(false)}}>취소</Button>
                    <Button primary onClick={()=>{onCreate(name.current.value, description.current.value); setShow(false);}}>확인</Button>
                </ButtonWrap>
            </Container>
        </ModalBase>
    )
}

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const Title = styled.div`
    text-align: center;
    color: #448569;
    font-size: 80px;
`;

const Label = styled.div`
    text-align: left;
    color: black;
    font-size: 50px;
    margin-bottom: 5px;
`;

const Input = styled.input`
    border-color: #448569;
    font-size: 50px;
    height: 95px;
    margin-bottom: 45px;
`;

const ButtonWrap = styled.div`
    width: 100%,
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

const Button = styled.button`
    border-radius: 10px;
    border: 0;
    width: 50%;
    height: 95px;
    font-size: 50px;
    text-align: center;
    color: white;
    background-color: ${props=>props.primary ? "#448569" : "#D9D9D9"};
`;


