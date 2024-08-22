export const TrailList: string = `() => {
    return (
        <div className="bg-white p-4">
            <div className="flex justify-between items-center mb-4">
                <input
                    type="text"
                    placeholder="Find parks"
                    className="flex-grow p-2 rounded-lg border border-gray-300"
                />
                <button className="ml-2 p-2 bg-gray-200 rounded-lg">
                    <LuFilter />
                </button>
            </div>

            <div className="flex space-x-2 mb-4">
                <button className="flex-1 px-2 py-3 bg-gray-100/30 border border-green-900 text-green-700 rounded-lg">
                    Nearby
                </button>
                <button className="flex-1 px-2 py-3 bg-gray-100/30 border border-green-900 text-green-700 rounded-lg">
                    Epic views
                </button>
                <button className="flex-1 px-2 py-3 bg-gray-100/30 border border-green-900 text-green-700 rounded-lg">
                    Wildflowers
                </button>
            </div>

            <div className="flex flex-col space-y-4">
                {/* Card 1 */}
                <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                    <img
                        src="/stock/landscape0.jpg"
                        alt="Hiking Trail"
                        className="w-full h-40 object-cover"
                    />
                    <div className="p-4">
                        <h3 className="font-semibold text-lg">
                            Steep Ravine, Dipsea and Matt Davis
                        </h3>
                        <p className="text-gray-500">
                            Stinson Beach, California
                        </p>
                        <div className="flex items-center text-gray-500 mt-2">
                            <span className="mr-2">⭐ 4.8</span>
                            <span className="mr-2">• Moderate</span>
                            <span>• 6.60 mi • Est. 3h 41m</span>
                        </div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                    <img
                        src="/stock/landscape1.jpg"
                        alt="Hiking Trail"
                        className="w-full h-40 object-cover"
                    />
                    <div className="p-4">
                        <h3 className="font-semibold text-lg">
                            Bear Mountain, Appalachian Trail
                        </h3>
                        <p className="text-gray-500">Bear Mountain, New York</p>
                        <div className="flex items-center text-gray-500 mt-2">
                            <span className="mr-2">⭐ 4.7</span>
                            <span className="mr-2">• Hard</span>
                            <span>• 4.00 mi • Est. 2h 20m</span>
                        </div>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                    <img
                        src="/stock/landscape2.jpg"
                        alt="Hiking Trail"
                        className="w-full h-40 object-cover"
                    />
                    <div className="p-4">
                        <h3 className="font-semibold text-lg">
                            Sunset Ridge, Griffith Park
                        </h3>
                        <p className="text-gray-500">Los Angeles, California</p>
                        <div className="flex items-center text-gray-500 mt-2">
                            <span className="mr-2">⭐ 4.9</span>
                            <span className="mr-2">• Easy</span>
                            <span>• 3.20 mi • Est. 1h 30m</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

`