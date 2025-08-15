import { useEffect, useState } from 'react';
import './RegistrationSys.css';
import { useParams } from 'react-router-dom';
import App from './App';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Outlet } from 'react-router-dom';


function RegistrationSys(){

    const [nameV, setName] = useState('');
    const [emailV, setEmail] = useState('');
    const [color, setColor] = useState(false);
    const [fade, setFade] = useState(false);
    const [errMsg, setErrMsg] = useState('');
    const [errCode, setErrCode] = useState(0);
    const [formName, setFormName] = useState('');



    useEffect(() => {
        if(nameV.length > 0 && emailV.length > 0){
            setColor(true);
        } else {
            setColor(false)
        }
    }, [nameV,emailV])


    const submitForm = async (e) => {
        e.preventDefault();
        try {


            const methodOptions = {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: nameV, email: emailV})
            }

            const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/${id}/register`, methodOptions);
            const data = await response.json();
            if('errors' in data){
                const box = document.getElementById('errMsgs')
                box.innerText = '';
                for(let i = 0; i < data.errors.length; i++){
                const text = document.createElement('p');
                text.innerText = data.errors[i].msg;
                box.appendChild(text);
                }
                setFade(!fade)
                setTimeout(() => {
                    setFade(false)
                }, 3000)
            } else {
                alert(data)
            }
        } catch (err) {
            console.log(err);
        } finally{
            setName('');
            setEmail('');
        }
    }

    const {id} = useParams();

    const navigate = useNavigate();

    const homePage = () => {
        navigate(`/${id}`)
    }


    return(
        <div className='absolute rounded-xl left-[25%] top-[15%] border-2 border-solid bg-red-500 w-2/5 h-2/4 top-5 my-5 mx-5'>
            <div className='flex items-center bg-violet-500 w-full h-20 rounded-xl'>
                <div className='bottom-[95%] ml-2 absolute
                '><button onClick={homePage} className='flex items-center justify-center bg-red-500 
                rounded-full w-4 h-4 cursor-pointer hover:bg-red-700'><p className='text-center text-white text-sm opacity-0 hover:opacity-50'>
                    x</p></button>
                    </div>
                <p className='font-bold ml-5 text-2xl'>Form Registration</p>
                <p className='font-bold text-2xl relative left-[35%]'></p>
            </div>
            <div className='flex flex-col rounded-xl border-2 border-solid bg-teal-500 w-full h-[84%]'>
                <form action="" onSubmit={submitForm}> 
                    <label className='text-base hover:text-white flex absolute top-[27%] ml-3' htmlFor="name">Name</label>
                    <input placeholder='John Doe' type="text" className='ml-3 absolute w-3/4 top-[33%] border-2 border-solid rounded-lg' value={nameV} onChange={e => setName(e.target.value)}/>
                    <label className='text-base hover:text-white flex absolute top-[54%]  mb-4 ml-3' htmlFor="email">Email</label>
                    <input placeholder='johndoe@gmail.com' className='ml-3 absolute w-3/4 top-[60%]  border-2 border-solid rounded-lg' type="email" autoComplete='email' value={emailV} onChange={e => setEmail(e.target.value)}/>
                    <button type='submit' 
                    className={`${color ? 'hover:bg-green-500 hover:duration-350' : 'hover:bg-red-500 hover:duration-350'} cursor-pointer border-2 border-solid w-23 h-12 rounded-xl bg-white absolute top-[85%] left-[40%]`}>Register</button>
                </form>
            </div>
            <div className={`${fade ? 'visible' : 'invisible duration-300'} border-2 border-solid bg-red-500 
            relative bottom-[60%] left-[20%] 
            w-[50%] h-1/3 rounded-xl flex justify-center flex`}>
                <div id='errMsgs' className='bg-rose-500 border-2 border-solid w-full
                h-1/2 relative rounded-xl flex justify-center items-center flex-wrap'>
                    <div className='w-screen'></div>
                </div>
            </div>
        </div>
    )
}



export default RegistrationSys