import React, { useRef } from 'react';
import { NodeProps } from 'reactflow';
import { LuHardDriveUpload } from 'react-icons/lu';
import 'reactflow/dist/style.css';
import '../../index.css';

const ImageUploadNode: React.FC<NodeProps> = ({ id, data }) => {
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            if (reader.result && imageInputRef.current) {
                imageInputRef.current.value = "";
                data.onUpload(id, reader.result.toString());
            }
        };
    };

    const handleUpload = (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if ('dataTransfer' in event) {
            const files = event.dataTransfer.files;
            if (files?.[0]) {
                handleFile(files[0]);
            }
        } else if ('files' in event.target) {
            const files = event.target.files;
            if (files?.[0]) {
                handleFile(files[0]);
            }
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    return (
        <div 
            className="flex flex-col items-center p-10 shadow-lg rounded-lg text-white bg-stone-900/70 border-2 border-stone-400" 
            onDrop={handleUpload} 
            onDragOver={handleDragOver}
        >
            <div className='flex flex-col items-center p-10 mb-4 rounded-lg border border-dashed'>
            <LuHardDriveUpload size={50} color="#fff" />
            <p className="p-4 font-semibold">Drag and Drop a Screenshot</p>
            </div>
            <p className="py-2">Or</p>
            <input 
                className="hidden" 
                type="file" 
                ref={imageInputRef} 
                onChange={handleUpload} 
            />
            <button 
                className="mt-2 px-4 py-2 bg-zinc-700 text-white font-semibold rounded-lg hover:bg-zinc-900 focus:outline-none"
                onClick={() => imageInputRef.current?.click()}
            >
                Browse
            </button>
        </div>
    );
};

export default ImageUploadNode;
