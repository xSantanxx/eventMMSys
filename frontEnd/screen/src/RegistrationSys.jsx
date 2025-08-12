import { useEffect, useState } from 'react';
import './RegistrationSys.css';


function RegistrationSys(){

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [color, setColor] = useState(false);

    useEffect(() => {
        setColor
    })


    return(
        <div className='absolute rounded-xl left-[25%] top-[15%] border-2 border-solid bg-red-500 w-2/5 h-2/4 top-5 my-5 mx-5'>
            <div className='flex items-center bg-violet-500 w-full h-20 rounded-xl'>
                <p className='font-bold ml-5 text-2xl'>Form Registration</p>
            </div>
            <div className='flex flex-col rounded-xl border-2 border-solid bg-teal-500 w-full h-[84%]'>
                <form action="">
                    <label className='text-base hover:text-white flex absolute top-[27%] mb-4 ml-3' htmlFor="email">Email</label>
                    <input placeholder='johndoe@gmail.com' className='ml-3 absolute w-3/4 top-[33%] border-2 border-solid rounded-lg' type="email" autoComplete='email' value={email} onChange={e => setEmail(e.target.value)}/>
                    <label className='text-base hover:text-white flex absolute top-[54%] ml-3' htmlFor="name">Name</label>
                    <input placeholder='John Doe' type="text" className='ml-3 absolute w-3/4 top-[60%] border-2 border-solid rounded-lg' value={name} onChange={e => setName(e.target.value)}/>
                    <button className={`${color ? 'hover:bg-green-500' : 'hover:bg-red-500'} cursor-pointer border-2 border-solid w-23 h-12 rounded-xl bg-white absolute top-[85%] left-[40%]`}>Register</button>
                </form>
            </div>
        </div>
    )
}



export default RegistrationSys