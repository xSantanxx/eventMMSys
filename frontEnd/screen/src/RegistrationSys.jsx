import { useEffect, useState } from 'react';
import './RegistrationSys.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';


function RegistrationSys(){

    const [nameV, setName] = useState('');
    const [emailV, setEmail] = useState('');
    const [color, setColor] = useState(false);
    const [fade, setFade] = useState(false);
    const [errMsg, setErrMsg] = useState('');
    const [errCode, setErrCode] = useState(0);
    const [formName, setFormName] = useState('');
    const [eventName, setEventName] = useState('');

    const location = useLocation();
    const navigate = useNavigate();
    const eventId = location.state?.eventId || sessionStorage.getItem('selectedEventId');

    useEffect(() => {
        if (!eventId) {
            navigate('/');
            return;
        }
        sessionStorage.setItem('selectedEventId', eventId);

        async function eventInfo(){
            const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/${eventId}`);
            const data = await response.json();

            setEventName(data[0].name)
        }
        eventInfo();
    }, [eventId, navigate])

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

            const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/${eventId}/register`, methodOptions);
            const data = await response.json();
            console.log(data);
            if('errors' in data){
            toast.error(<div style={{whiteSpace: 'pre-line'}}>{data.errors.map((err) => err.msg).join('\n')}</div>);
                // setErrMsgs(data.errors.map((err) => err.msg));
                // const box = document.getElementById('errMsgs')
                // box.innerText = '';
                // for(let i = 0; i < data.errors.length; i++){
                // const text = document.createElement('p');
                // text.innerText = data.errors[i].msg;
                // box.appendChild(text);
                // }
                // setFade(!fade)
                // setTimeout(() => {
                //     setFade(false)
                // }, 3000)
            } else if ('success' in data) {
                toast.success(data.success);
            } else {
                let i = data.detail.split(' ');
                toast.error('Email ' + i[4] + ' ' + i[5])
            }
        } catch (err) {
            console.log(err);
        } finally{
            setName('');
            setEmail('');
        }
    }

    const homePage = () => {
        navigate('/event', { state: { eventId } })
    }


    return(
        <div className='absolute rounded-xl left-1/2 -translate-x-1/2 top-[-50%] border-2 border-solid border-zinc-800 w-[min(92vw,680px)] min-h-[420px] bg-zinc-900 text-zinc-100'>
            <div className='flex items-center bg-sky-900/40 w-full h-20 rounded-t-lg overflow-y-auto'>
                <div className='bottom-[95%] ml-2 absolute
                '><button onClick={homePage} className='transition-all duration-300 hover:outline-2 hover:outline-red-500 flex items-center justify-center bg-red-500 
                rounded-full w-4 h-4 cursor-pointer hover:bg-red-700'><p className='text-center text-white text-sm opacity-0 hover:opacity-50'>
                    x</p></button>
                    </div>
                <p className='font-bold ml-7 text-2xl mr-16'>Form Registration</p>
                <div className='flex jusitfy-end-safe'><p className='font-bold text-xl'>{eventName}</p></div>
            </div>
            <div className='flex flex-col rounded-b-xl bg-zinc-900 w-full h-[84%] px-4 py-5'>
                <form action="" onSubmit={submitForm} className='flex flex-col gap-4'> 
                    <label className='text-base font-semibold' htmlFor="name">Name</label>
                    <input id='name' placeholder='John Doe' type="text" className='w-full border-2 border-solid rounded-lg px-3 py-2 bg-zinc-950 text-zinc-100 placeholder:text-zinc-400 border-zinc-700' value={nameV} onChange={e => setName(e.target.value)}/>
                    <label className='text-base font-semibold' htmlFor="email">Email</label>
                    <input id='email' placeholder='johndoe@gmail.com' className='w-full border-2 border-solid rounded-lg px-3 py-2 bg-zinc-950 text-zinc-100 placeholder:text-zinc-400 border-zinc-700' type="email" autoComplete='email' value={emailV} onChange={e => setEmail(e.target.value)}/>
                    <button type='submit' 
                    className={`${color ? 'hover:bg-emerald-500 hover:duration-350' : 'hover:bg-red-500 hover:duration-350'} mt-2 cursor-pointer border-2 border-solid border-emerald-700 w-full sm:w-40 h-12 rounded-xl bg-emerald-600 text-zinc-50 self-start`}>Register</button>
                </form>
            </div>
            {/* <div className={`${fade ? 'visible' : 'invisible duration-300'} border-2 border-solid bg-red-600/90 border-red-400 text-zinc-50
            relative bottom-[60%] left-[20%] 
            w-[50%] h-1/3 rounded-xl flex justify-center flex`}>
                <div id='errMsgs' className='bg-red-700/60 border-2 border-solid border-red-500/40 w-full
                h-1/2 relative rounded-xl flex justify-center items-center flex-wrap'>
                    <div className='w-screen'></div>
                </div>
            </div> */}
        </div>
    )
}



export default RegistrationSys