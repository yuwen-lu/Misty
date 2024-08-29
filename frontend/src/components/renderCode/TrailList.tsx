export const TrailList: string = `


() => {
    return (
        <div className="max-w-2xl mx-auto bg-white p-4">
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Find parks"
                    className="w-full p-2 border border-gray-300 rounded"
                />
            </div>

            <div className="mb-4">
                <button className="mr-2 px-3 py-1 bg-gray-100 text-gray-700 rounded">
                    Nearby
                </button>
                <button className="mr-2 px-3 py-1 bg-gray-100 text-gray-700 rounded">
                    Epic views
                </button>
                <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded">
                    Wildflowers
                </button>
            </div>

            <div className="space-y-4 text-gray-800">
                {[
                    {
                        name: "Steep Ravine, Dipsea and Matt Davis",
                        location: "Stinson Beach, California",
                        rating: 4.8,
                        difficulty: "Moderate",
                        distance: "6.60 mi",
                        time: "Est. 3h 41m",
                    },
                    {
                        name: "Bear Mountain, Appalachian Trail",
                        location: "Bear Mountain, New York",
                        rating: 4.7,
                        difficulty: "Hard",
                        distance: "4.00 mi",
                        time: "Est. 2h 20m",
                    },
                    {
                        name: "Sunset Ridge, Griffith Park",
                        location: "Los Angeles, California",
                        rating: 4.9,
                        difficulty: "Easy",
                        distance: "3.20 mi",
                        time: "Est. 1h 30m",
                    },{
                        name: "Yosemite Falls Trail",
                        location: "Yosemite National Park, California",
                        rating: 4.8,
                        difficulty: "Hard",
                        distance: "7.20 mi",
                        time: "Est. 6h 00m",
                    },
                    {
                        name: "Angel's Landing",
                        location: "Zion National Park, Utah",
                        rating: 4.9,
                        difficulty: "Hard",
                        distance: "5.40 mi",
                        time: "Est. 4h 00m",
                    },
                ].map((trail, index) => (
                    <div
                        key={index}
                        className="border border-gray-200 p-4 rounded"
                    >
                        <h3 className="font-semibold text-lg">{trail.name}</h3>
                        <p className="text-gray-600">{trail.location}</p>
                        <div className="mt-2 text-sm text-gray-500">
                            <span className="mr-2">⭐ {trail.rating}</span>
                            <span className="mr-2">• {trail.difficulty}</span>
                            <span>
                                {trail.distance} • {trail.time}
                            </span>
                        </div>
                        <button
                            disabled={true}
                            className="mt-2 text-red-500 text-sm"
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

`

// the previous version:


// () => {
//     return (
//         <div className="bg-white p-4 relative">
//             <div className="flex justify-between items-center mb-4">
//                 <input
//                     type="text"
//                     placeholder="Find parks"
//                     className="flex-grow p-2 rounded-lg border border-gray-300"
//                 />
//                 <button className="ml-2 p-2 bg-gray-200 rounded-lg">
//                     <LuFilter />
//                 </button>
//             </div>

//             <div className="flex space-x-2 mb-4">
//                 <button className="flex-1 px-2 py-3 bg-gray-100/30 border border-green-900 text-green-700 rounded-lg">
//                     Nearby
//                 </button>
//                 <button className="flex-1 px-2 py-3 bg-gray-100/30 border border-green-900 text-green-700 rounded-lg">
//                     Epic views
//                 </button>
//                 <button className="flex-1 px-2 py-3 bg-gray-100/30 border border-green-900 text-green-700 rounded-lg">
//                     Wildflowers
//                 </button>
//             </div>

//             <div className="flex flex-col space-y-4">
//                 {/* Card 1 */}
//                 <div className="bg-white rounded-lg overflow-hidden shadow-lg">
//                     <img
//                         src="/stock/landscape0.jpg"
//                         alt="Hiking Trail"
//                         className="w-full h-40 object-cover"
//                     />
//                     <div className="p-4 text-gray-500">
//                         <h3 className="font-semibold text-md">
//                             Steep Ravine, Dipsea and Matt Davis
//                         </h3>
//                         <p>Stinson Beach, California</p>
//                         <div className="flex items-center mt-1">
//                             <span className="mr-2">⭐ 4.8</span>
//                             <span className="mr-2">• Moderate</span>
//                             <span>• 6.60 mi • Est. 3h 41m</span>
//                         </div>
//                         <button
//                             enabled={false}
//                             className="mt-2 text-red-500"
//                         >
//                             Delete
//                         </button>
//                     </div>
//                 </div>

//                 {/* Card 2 */}
//                 <div className="bg-white rounded-lg overflow-hidden shadow-lg">
//                     <img
//                         src="/stock/landscape1.jpg"
//                         alt="Hiking Trail"
//                         className="w-full h-40 object-cover"
//                     />
//                     <div className="p-4 text-gray-500">
//                         <h3 className="font-semibold text-md">
//                             Bear Mountain, Appalachian Trail
//                         </h3>
//                         <p>Bear Mountain, New York</p>
//                         <div className="flex items-center mt-1">
//                             <span className="mr-2">⭐ 4.7</span>
//                             <span className="mr-2">• Hard</span>
//                             <span>• 4.00 mi • Est. 2h 20m</span>
//                         </div>
//                         <button
//                             enabled={false}
//                             className="mt-2 text-red-500"
//                         >
//                             Delete
//                         </button>
//                     </div>
//                 </div>

//                 {/* Card 3 */}
//                 <div className="bg-white rounded-lg overflow-hidden shadow-lg">
//                     <img
//                         src="/stock/landscape2.jpg"
//                         alt="Hiking Trail"
//                         className="w-full h-40 object-cover"
//                     />
//                     <div className="p-4 text-gray-500">
//                         <h3 className="font-semibold text-md">
//                             Sunset Ridge, Griffith Park
//                         </h3>
//                         <p>Los Angeles, California</p>
//                         <div className="flex items-center mt-1">
//                             <span className="mr-2">⭐ 4.9</span>
//                             <span className="mr-2">• Easy</span>
//                             <span>• 3.20 mi • Est. 1h 30m</span>
//                         </div>
//                         <button
//                             enabled={false}
//                             className="mt-2 text-red-500"
//                         >
//                             Delete
//                         </button>
//                     </div>
//                 </div>
//             </div>

            
//         </div>
//     );
// };
