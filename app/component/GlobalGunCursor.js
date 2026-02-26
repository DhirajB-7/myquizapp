"use client";
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CursorWrapper = styled(motion.div)`
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 999999;
    mix-blend-mode: difference;
    will-change: transform;

    /* Responsive Guard: Hide on touch devices */
    @media (hover: none) and (pointer: coarse) {
        display: none;
    }
`;

const PointerArrow = styled(motion.div)`
    position: absolute;
    width: 0;
    height: 0;
    /* This creates a sharp minimalist triangle arrow */
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 14px solid #fff;
    /* Tilted to feel like a traditional cursor */
    transform-origin: center;
`;

const GlobalGunCursor = () => {
    const [isPressed, setIsPressed] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Ultra-responsive spring (Fast but smooth)
    const springX = useSpring(mouseX, { damping: 45, stiffness: 1000, mass: 0.1 });
    const springY = useSpring(mouseY, { damping: 45, stiffness: 1000, mass: 0.1 });

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
        checkMobile();

        const moveMouse = (e) => {
            if (!isVisible) setIsVisible(true);
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);

            // Logic to detect if hovering over buttons/links
            const target = e.target;
            const isClickable = target.closest('button, a, input, [role="button"]');
            setIsHovering(!!isClickable);
        };

        const handleDown = () => setIsPressed(true);
        const handleUp = () => setIsPressed(false);
        const handleLeave = () => setIsVisible(false);

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

    if (!isVisible || isMobile) return null;

    return (
        <CursorWrapper style={{ x: springX, y: springY, translateX: '-2px', translateY: '-2px' }}>
            <PointerArrow 
                animate={{ 
                    // Slightly grows on hover, shrinks on click
                    scale: isPressed ? 0.75 : isHovering ? 1.3 : 1,
                    // Subtle rotation change on click for "mechanical" feel
                    rotate: isPressed ? -15 : -30 
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        </CursorWrapper>
    );
};

export default GlobalGunCursor;