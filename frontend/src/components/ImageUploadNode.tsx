import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';

const ImageUploadNode: React.FC<NodeProps> = ({ id, data }) => {
    const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    data.onUpload(id, reader.result.toString());
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="upload-node">
            <p>Upload Screenshot</p>
            <input type="file" onChange={handleUpload} />
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default ImageUploadNode;
