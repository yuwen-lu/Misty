import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import '../index.css';

const SubImageNode: React.FC<NodeProps> = ({ data }) => {

    return (
        <div className='flex flex-col items-center p-5 bg-white rounded-lg border-2 border-stone-400'>
            <img
                src={data.image}
                alt={"Subimage"}
                style={{ maxWidth: '30vw', maxHeight: '40vh' }}
            >
            </img>
            Subsection of image
        </div>
    )
};

export default SubImageNode;