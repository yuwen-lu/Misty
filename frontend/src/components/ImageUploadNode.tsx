import React, { useState, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import '../index.css';

const ImageUploadNode: React.FC<NodeProps> = ({ id, data }) => {

    const [uploadedImageString, setUploadedImageString] = useState<string>("");
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                if (reader.result) {
                    setUploadedImageString(reader.result.toString());
                }
            };
        }
    };

    const importImage = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (uploadedImageString.length > 0) {
            data.onUpload(id, uploadedImageString);
            
            // clear the input field after import
            setUploadedImageString("");
            if (imageInputRef.current) {
                imageInputRef.current.value = "";
            }
        } else {
            alert("Please choose an image to import.");
        }
    }

    return (
        <div className="upload-node flex flex-col items-center px-4 py-2 shadow-md rounded-lg bg-white border-2 border-stone-400">
            <p className='py-6 font-semibold'>Upload Screenshot</p>
            <input className='py-4 px-2' type="file" ref={imageInputRef} onChange={handleUpload} />
            <button className='rounded-md m-2 px-3 py-2 bg-teal-500 text-white font-semibold rounded-md hover:bg-teal-700 focus:outline-none' onClick={importImage}>Import</button>
            {/* <Handle type="source" position={Position.Bottom} /> */}
        </div>
    );
};

export default ImageUploadNode;
