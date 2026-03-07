import { worker } from 'sst-react-router-cloudflare';

export default worker(import.meta.env.MODE);
