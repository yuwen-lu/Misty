export const RideSearch = `() => {
    return (
        <div className="bg-white flex flex-col items-center">
            <img
                src="/stock/portrait7.jpg"
                alt="Rides"
                className="w-full h-full z-0 object-cover absolute"
            />
            <div className="w-full p-6 bg-white/95 rounded-lg shadow-lg z-10 mt-40">
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
                        disabled={true}
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                    >
                        Search
                    </button>
                </form>
            </div>
        </div>
    );
};

`