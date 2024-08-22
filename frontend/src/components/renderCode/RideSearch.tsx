export const RideSearch = `() => {
    return (
        <div className="bg-white flex flex-col items-center">
            <img
                src="/stock/portrait2.jpg"
                alt="Rides"
                className="w-full h-1/2 z-0 absolute"
            />
            <div className="w-5/6 max-w-sm mx-auto p-6 bg-white/95 rounded-lg shadow-lg z-10 mt-40">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Pick your next ride
                </h2>
                <form className="space-y-4">
                    <div>
                        <label className="block mb-1 text-gray-700">
                            Leaving from
                        </label>
                        <input
                            type="text"
                            placeholder="Departure"
                            className="text-gray-400 w-full px-4 py-2 border rounded-lg focus:outdivne-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-gray-700">
                            Going to
                        </label>
                        <input
                            type="text"
                            placeholder="Destination"
                            className="text-gray-400 w-full px-4 py-2 border rounded-lg focus:outdivne-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-gray-700">Date</label>
                        <input
                            type="date"
                            className="text-gray-400 w-full px-4 py-2 border rounded-lg focus:outdivne-none focus:border-blue-500"
                        />
                    </div>
                    {/* <div>
                        <label className="block mb-1 text-gray-700">
                            Passengers
                        </label>
                        <input
                            type="number"
                            defaultValue={1}
                            className="text-gray-400 w-full px-4 py-2 border rounded-lg focus:outdivne-none focus:border-blue-500"
                        />
                    </div> */}
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                    >
                        Search
                    </button>
                </form>
            </div>
            <div className="w-full max-w-sm mx-auto mt-6 p-4 bg-white text-gray-700">
                <div className="flex flex-col space-y-2">
                    <div className="mx-2 flex justify-between items-center">
                        <LuClock size={24}/>
                        <div className="ml-5 flex flex-col space-y-1"> 
                            <div className="grow">Lumen Field, Seattle → U District, University of Washington</div>
                            <div className="text-gray-500">Sat 16 June</div>
                        </div>
                            <LuChevronRight size={24}/>
                    </div>
                    <div className="mx-2 flex justify-between items-center">
                        <LuClock size={24}/>
                        <div className="ml-5 flex flex-col space-y-1"> 
                            <div className="grow">Kings Station, Seattle, WA → SEA Airport, Departure</div>
                            <div className="text-gray-500">Sun 17 June</div>
                        </div>
                            <LuChevronRight size={24}/>
                    </div>
                    <div className="mx-2 flex justify-between items-center">
                        <LuClock size={24}/>
                        <div className="ml-5 flex flex-col space-y-1"> 
                            <div className="grow">Kerry Park, Seattle → Space Needle, Seattle</div>
                            <div className="text-gray-500">Mon 18 June</div>
                        </div>
                            <LuChevronRight size={24}/>
                    </div>
                            
                </ul>
            </div>
        </div>
    );
};

`