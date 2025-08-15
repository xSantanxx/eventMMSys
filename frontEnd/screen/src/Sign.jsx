import { useNavigate, useParams } from 'react-router-dom'
import './Sign.css'
import {Scanner} from '@yudiel/react-qr-scanner'


function Sign(){

const {id} = useParams();

const checkIn = async (result) => {
    try{
        const checkId = result[0].rawValue

        const methodOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({user: checkId})
        }

        const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/${id}/signin`, methodOptions);
        const data = await response.text();
        alert(data);
    } catch (err) {
        console.log(err)
    }
}

const navigate = useNavigate();

const backPage = () => {
    navigate(`/${id}`);
}

    return(
        <div className='bg-zinc-200 overflow-x-auto absolute left-[27%] rounded-xl top-[24%] border-2 border-solid w-1/2 h-2/3'>
            <div className='relative w-full h-12 bg-sky-200 rounded-t-lg flex items-center justify-center'>
                <p className='text-2xl font-bold'>Sign In</p>
                <div className='hover:outline-red-500 hover:outline-2 hover:bg-red-700 duration-300 bg-red-500 absolute left-[1%] rounded-full w-5 flex justify-center px-2
                '>
                    <button onClick={backPage} className='cursor-pointer'>
                        <p className='text-center text-white text-sm opacity-0 hover:opacity-50'>x</p>
                        </button>
                        </div>
            </div>
            <Scanner onScan={checkIn}></Scanner>
        </div>
    )
}


export default Sign