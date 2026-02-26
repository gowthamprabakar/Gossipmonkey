import { useNavigate } from 'react-router-dom';
import Landing from '../components/Landing';

const SplashPage = () => {
  const navigate = useNavigate();
  return <Landing onEnter={() => navigate('/onboarding')} />;
};

export default SplashPage;
