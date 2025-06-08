export const AppSettings = `
() => {
    return (
        <div className="flex flex-col h-screen bg-gray-100 text-gray-800">
            {/* Top bar */}
            <div className="flex items-center justify-between p-4 bg-white">
                <div className="flex-1" />
                <h1 className="text-lg font-semibold">App Settings</h1>
                <div className="w-6 h-6 flex items-center justify-center"></div>
            </div>
            {/* Main content - centered vertically */}
            <div className="flex mt-40 p-4">
                <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
                    <h2 className="text-xl font-semibold mb-1">
                        General Settings
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Customize your app experience
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-100 rounded">
                            <div className="flex items-center">
                                <LuVolume2 size={20} className="mr-3" />
                                <span>Sound</span>
                            </div>
                            <div className="w-12 h-6 bg-blue-500 rounded-full flex items-center p-1">
                                <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-100 rounded">
                            <div className="flex items-center">
                                <LuBell size={20} className="mr-3" />
                                <span>Notifications</span>
                            </div>
                            <div className="w-12 h-6 bg-gray-300 rounded-full flex items-center p-1">
                                <div className="w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-100 rounded">
                            <div className="flex items-center">
                                <LuMoon size={20} className="mr-3" />
                                <span>Dark Mode</span>
                            </div>
                            <div className="w-12 h-6 bg-gray-300 rounded-full flex items-center p-1">
                                <div className="w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>
                    </div>
                    <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium mt-6">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

`;