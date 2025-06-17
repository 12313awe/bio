
import React from 'react';
import WaterBackground from '../components/WaterBackground';
import ChatInterface from '../components/ChatInterface';

const Index = () => {
  return (
    <div className="min-h-screen">
      
      <WaterBackground>
        <div className="min-h-screen flex items-center justify-center">
          <ChatInterface />
        </div>
      </WaterBackground>
    </div>
  );
};

export default Index;
