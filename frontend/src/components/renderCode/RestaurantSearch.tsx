export const RestaurantSearch = `() => {
    return (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-md rounded-t-3xl p-6 space-y-4 transform transition-transform duration-300 ease-out translate-y-0">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Book a Table
                    </h2>
                    <button className="text-gray-500">
                        <LuX size={24} />
                    </button>
                </div>
                <p className="text-sm text-gray-500">
                    Reserve your spot at our restaurant
                </p>
                <form className="space-y-4">
                    <div>
                        <label className="block mb-1 text-gray-700">Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                className="w-full px-6 py-2 border rounded-lg focus:outline-none focus:border-blue-500 pl-10"
                            />
                            <LuCalendar
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 text-gray-700">Time</label>
                        <div className="relative">
                            <input
                                type="time"
                                className="w-full px-6 py-2 border rounded-lg focus:outline-none focus:border-blue-500 pl-10"
                            />
                            <LuClock
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 text-gray-700">
                            Number of Guests
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                defaultValue={2}
                                min={1}
                                max={10}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 pl-10"
                            />
                            <LuUsers
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                        </div>
                    </div>
                </form>

                <button className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-blue-600 transition duration-300">
                    Reserve Table
                </button>
            </div>
        </div>
    );
};

`