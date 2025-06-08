export const PhoneApp: string = `() => {
    return (
        <div className="bg-zinc-50 text-black h-screen w-full max-w-md mx-auto flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4">
                
                    <div className="w-10 h-10 bg-blue-300 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">GJ</span>
                    </div>

                <div className="flex space-x-2">
                    <div className="w-8 h-8 text-purple-500 rounded-full flex items-center justify-center">
                        <LuCheck className="w-4 h-4 " />
                    </div>
                    <div className="w-8 h-8 text-purple-500 rounded-full flex items-center justify-center">
                        <LuText className="w-4 h-4 " />
                    </div>
                    <div className="w-8 h-8 text-purple-500 rounded-full flex items-center justify-center">
                        <LuSearch className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Phone number */}

            <h1 className="ml-3 text-2xl font-bold">Primary Number</h1>
            <div className="px-4 py-2 flex items-center space-x-2">
                <LuPhone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">(938) 800-9436</span>
            </div>

            {/* Contact list */}
            <div className="flex-grow overflow-y-auto">
                <div className="p-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-300 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">JS</span>
                    </div>
                    <div>
                        <h2 className="font-semibold">Joshua Smith</h2>
                        <p className="text-orange-500 text-sm">
                            You: Hey there! How's your day going?
                        </p>
                    </div>
                </div>
                <div className="p-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">JD</span>
                    </div>
                    <div className="flex-grow">
                        <h2 className="font-semibold">Jane Doe</h2>
                        <p className="text-gray-500 text-sm">Call ended</p>
                    </div>
                    <span className="text-gray-400 text-sm">4:27 PM</span>
                </div>
                <div className="p-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">BW</span>
                    </div>
                    <div className="flex-grow">
                        <h2 className="font-semibold">Ben White</h2>
                        <p className="text-gray-500 text-sm">Call ended</p>
                    </div>
                    <span className="text-gray-400 text-sm">Tue</span>
                </div>
                <div className="p-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">OT</span>
                    </div>
                    <div>
                        <h2 className="font-semibold">OpenPhone Team</h2>
                        <p className="text-gray-600 text-sm">
                            Hey Alex 👋 Welcome aboard!
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom navigation */}
            <div className="absolute bottom-0 w-full flex justify-around items-center p-4 bg-white">
                <div className="flex flex-col items-center text-purple-600">
                    <LuHome className="w-6 h-6" />
                    <span className="text-xs">Home</span>
                </div>
                <div className="flex flex-col items-center text-gray-400">
                    <LuHash className="w-6 h-6" />
                    <span className="text-xs">Keypad</span>
                </div>
                <div className="flex flex-col items-center text-gray-400">
                    <LuBook className="w-6 h-6" />
                    <span className="text-xs">Contacts</span>
                </div>
                <div className="flex flex-col items-center text-gray-400">
                    <LuBell className="w-6 h-6" />
                    <span className="text-xs">Activity</span>
                </div>
            </div>

            {/* Floating action button */}
            <div className="absolute bottom-20 right-4">
                <button className="bg-purple-600 text-white rounded-full p-4 shadow-lg">
                    <LuPencil className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

`
  