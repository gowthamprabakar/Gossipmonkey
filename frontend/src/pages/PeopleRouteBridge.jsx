import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const PeopleRouteBridge = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    navigate(`/channels/${roomId}?panel=people`, { replace: true });
  }, [navigate, roomId]);

  return null;
};

export default PeopleRouteBridge;
