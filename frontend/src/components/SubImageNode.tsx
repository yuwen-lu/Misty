import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import '../index.css';

const SubImageNode: React.FC<NodeProps> = ({ data }) => {

    return (
        <div className='flex flex-col items-center p-5 text-white bg-stone-900/70 rounded-lg border-2 border-stone-400'>
            <div className='text-l mb-3'>
                Selected Image Section
            </div>
            <img
                className='rounded-md'
                src={data.image}
                alt={"Subimage"}
                style={{ maxWidth: '20vw', maxHeight: '30vh' }}
            >
            </img>

            <Handle
                type="target"
                position={Position.Left}
                id="b"
                isConnectable={true}
            />
        </div>
    )
};

export default SubImageNode;