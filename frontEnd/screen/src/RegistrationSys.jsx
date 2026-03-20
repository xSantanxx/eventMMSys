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
    const [eventName, setEventName] = useState('');

    useEffect(() => {
        async function eventInfo(){
            const idurl = window.location.pathname;
            const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/${id}`);
            const data = await response.json();

            setEventName(data[0].name)
        }
        eventInfo();
    }, [])

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
            console.log(data);
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
            } else if ('success' in data) {
                alert(data.success);
            } else {
                let i = data.detail.split(' ');
                alert('Email ' + i[4] + ' ' + i[5])
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
        <div className='absolute rounded-xl left-1/2 -translate-x-1/2 top-[-50%] border-2 border-solid w-[min(92vw,680px)] min-h-[420px] bg-zinc-200'>
            <div className='flex items-center bg-sky-200 w-full h-20 rounded-t-lg overflow-y-auto'>
                <div className='bottom-[95%] ml-2 absolute
                '><button onClick={homePage} className='transition-all duration-300 hover:outline-2 hover:outline-red-500 flex items-center justify-center bg-red-500 
                rounded-full w-4 h-4 cursor-pointer hover:bg-red-700'><p className='text-center text-white text-sm opacity-0 hover:opacity-50'>
                    x</p></button>
                    </div>
                <p className='font-bold ml-7 text-2xl mr-16'>Form Registration</p>
                <div className='flex jusitfy-end-safe'><p className='font-bold text-xl'>{eventName}</p></div>
            </div>
            <div className='flex flex-col rounded-b-xl bg-zinc-200 w-full h-[84%] px-4 py-5'>
                <form action="" onSubmit={submitForm} className='flex flex-col gap-4'> 
                    <label className='text-base font-semibold' htmlFor="name">Name</label>
                    <input id='name' placeholder='John Doe' type="text" className='w-full border-2 border-solid rounded-lg px-3 py-2' value={nameV} onChange={e => setName(e.target.value)}/>
                    <label className='text-base font-semibold' htmlFor="email">Email</label>
                    <input id='email' placeholder='johndoe@gmail.com' className='w-full border-2 border-solid rounded-lg px-3 py-2' type="email" autoComplete='email' value={emailV} onChange={e => setEmail(e.target.value)}/>
                    <button type='submit' 
                    className={`${color ? 'hover:bg-green-500 hover:duration-350' : 'hover:bg-red-500 hover:duration-350'} mt-2 cursor-pointer border-2 border-solid w-full sm:w-40 h-12 rounded-xl bg-white self-start`}>Register</button>
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