"use client";
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CrosshairContainer = styled(motion.div)`
    position: fixed;
    top: 0;
    left: 0;
    width: 32px;
    height: 32px;
    pointer-events: none;
    z-index: 999999; /* Max priority */
    mix-blend-mode: difference;
    display: flex;
    align-items: center;
    justify-content: center;
    will-change: transform;

    /* Precise Center Point */
    &::before {
        content: '';
        position: absolute;
        width: 2px;
        height: 2px;
        background: #fff;
    }
`;

const Line = styled(motion.div)`
    position: absolute;
    background: #fff;
    
    &.vertical {
        width: 1px;
        height: 8px;
        &.top { top: 0; }
        &.bottom { bottom: 0; }
    }

    &.horizontal {
        height: 1px;
        width: 8px;
        &.left { left: 0; }
        &.right { right: 0; }
    }
`;

const GlobalGunCursor = () => {
    const [isPressed, setIsPressed] = useState(false);
    const [isVisible, setIsVisible] = useState(false); // Hide until first movement
    
    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    const springConfig = { damping: 25, stiffness: 500, mass: 0.3 };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);

    useEffect(() => {
        const moveMouse = (e) => {
            // Only show the cursor once the mouse actually moves
            if (!isVisible) setIsVisible(true);
            
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        
        const handleDown = () => setIsPressed(true);
        const handleUp = () => setIsPressed(false);
        const handleLeave = () => setIsVisible(false); // Hide if mouse leaves window

        window.addEventListener('mousemove', moveMouse);
        window.addEventListener('mousedown', handleDown);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('mouseleave', handleLeave);
        
        return () => {
            window.removeEventListener('mousemove', moveMouse);
            window.removeEventListener('mousedown', handleDown);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('mouseleave', handleLeave);
        };
    }, [mouseX, mouseY, isVisible]);

    if (!isVisible) return null;

    return (
        <CrosshairContainer 
            style={{ x, y, translateX: '-50%', translateY: '-50%' }}
            animate={{ 
                rotate: isPressed ? 45 : 0,
                scale: isPressed ? 1.2 : 1 
            }}
        >
            <Line className="vertical top" animate={{ y: isPressed ? -4 : 0 }} />
            <Line className="vertical bottom" animate={{ y: isPressed ? 4 : 0 }} />
            <Line className="horizontal left" animate={{ x: isPressed ? -4 : 0 }} />
            <Line className="horizontal right" animate={{ x: isPressed ? 4 : 0 }} />
        </CrosshairContainer>
    );
};

export default GlobalGunCursor;