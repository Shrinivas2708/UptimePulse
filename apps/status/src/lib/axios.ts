import axios from 'axios';
import { backend_url } from './exports';

const apiClient = axios.create({
    // baseURL:  '/api' // The proxy in vite.config.ts will handle this
    baseURL:`${backend_url}/api` 
    // baseURL:"http://localhost:3000/api" 
});


export {apiClient}