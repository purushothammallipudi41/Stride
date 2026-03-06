import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

const Marker = ({ position, content, color }) => {
    return (
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
            <group position={[position.x, position.y, position.z]}>
                <Sphere args={[0.2, 16, 16]}>
                    <MeshDistortMaterial color={color} speed={2} distort={0.3} />
                </Sphere>
                <Text
                    position={[0, 0.4, 0]}
                    fontSize={0.2}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
                >
                    {content}
                </Text>
            </group>
        </Float>
    );
};

const ImmersiveBoard = ({ socket, channelId, isOwner }) => {
    const [markers, setMarkers] = useState([]);

    useEffect(() => {
        if (!socket) return;

        socket.on('immersive-marker-added', (marker) => {
            setMarkers(prev => [...prev, marker]);
        });

        // Request initial state
        socket.emit('get-immersive-state', { channelId });

        return () => {
            socket.off('immersive-marker-added');
        };
    }, [socket, channelId]);

    const addMarker = (event) => {
        // Only allow adding on certain surface if we had a mesh, 
        // for now let's just use the mouse click position in 3D
        event.stopPropagation();
        const { x, y, z } = event.point;

        const newMarker = {
            id: Date.now(),
            position: { x, y, z },
            content: "Vibe Point",
            color: "#" + Math.floor(Math.random() * 16777215).toString(16),
            userId: socket.id
        };

        socket.emit('add-immersive-marker', { channelId, marker: newMarker });
        setMarkers(prev => [...prev, newMarker]);
    };

    return (
        <group>
            {/* The Invisible Interaction Plane */}
            <mesh onClick={addMarker} position={[0, 0, -2]}>
                <planeGeometry args={[20, 20]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Render Synchronized Markers */}
            {markers.map(m => (
                <Marker key={m.id} {...m} />
            ))}

            {/* A faint grid or background for context */}
            <gridHelper args={[20, 20, 0x444444, 0x222222]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -2.1]} />
        </group>
    );
};

export default ImmersiveBoard;
