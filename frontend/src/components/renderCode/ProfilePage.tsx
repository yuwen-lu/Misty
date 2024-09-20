export const profilePage = `() => {
    return (
        <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden">
                <img
                    src="/stock/IMG_4439.jpg"
                    alt="Avatar"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* User's Name */}
            <h1 className="mt-4 text-xl font-bold text-gray-800">Fuji </h1>

            {/* Brief Bio */}
            <p className="mt-2 text-center text-gray-600">
                Passionate nature photographer. Find me by the water, or in the woods.
            </p>

            {/* Contact Information */}
            <div className="mt-4 text-sm text-gray-700">
                <p>Email: photos@fuji.net</p>
                <p>Phone: +123 456 7890</p>
            </div>

            {/* List of Interests */}
            <div className="text-black mt-6 w-full">
                <h2 className="text-lg font-semibold text-gray-800">
                    Interests
                </h2>
                <ul className="mt-2 space-y-2">
                    <li className="p-2 bg-white rounded-lg ">
                        Film Camera
                    </li>
                    <li className="p-2 bg-white rounded-lg ">
                        Lofi Music
                    </li>
                    <li className="p-2 bg-white rounded-lg ">
                        Mid-Century Furniture
                    </li>
                    <li className="p-2 bg-white rounded-lg ">
                        Music Production
                    </li>
                </ul>
            </div>
        </div>
    );
};

`