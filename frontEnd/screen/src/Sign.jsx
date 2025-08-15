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
        <div className='overflow-x-auto absolute left-[27%] rounded-xl top-[24%] bg-teal-500 border-2 border-solid w-1/2 h-2/3'>
            <div className='relative w-full h-12 bg-red-500 rounded-t-lg flex items-center justify-center'>
                <p className='text-2xl font-bold'>Sign In</p>
                <div className='hover:bg-green-700 duration-300 bg-green-500 border-2 border-solid absolute left-[1%] rounded-xl w-7 h-7 flex justify-center px-2
                '>
                    <button onClick={backPage} className='cursor-pointer'>
                        <p>x</p>
                        </button>
                        </div>
            </div>
            <Scanner onScan={checkIn}></Scanner>
        </div>
    )
}


export default Sign