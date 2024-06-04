import React from 'react';
import { Handle, Position, Connection, HandleProps } from 'reactflow';

interface DissectHandleProps {
    position: Position;
    source: string;
}

export const DissectHandle: React.FC<DissectHandleProps> = ({ position, source }) => (
    <Handle
        type="target"
        position={position}
        isValidConnection={(connection: Connection) => connection.source === source}
        onConnect={(params: Connection) => console.log('handle onConnect', params)}
        style={{ background: '#fff' }}
    />
);