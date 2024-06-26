export const FidelityNaturalHeader: string = `() => {
    return (
        <div className="min-h-screen h-full bg-white text-black font-sans relative">
            <header className="flex justify-between items-center p-4 bg-white shadow-md">
                <div className="font-bold text-lg flex items-center">
                    <img src='/fidelity.png' className='w-6 mr-2' alt="Fidelity Logo" />
                    All accounts
                    <LuChevronDown />
                </div>
                <div className="flex items-center space-x-4">
                    <LuMoreHorizontal />
                    <LuSearch />
                    <LuUser />
                </div>
            </header>
            <section className="p-4 bg-gradient-to-r from-purple-300 to-blue-300 text-center rounded-lg mb-4">
                <h2 className="text-2xl font-bold mb-2">Rethink Simplicity</h2>
                <p className="text-lg mb-4">
                    Tired of too many different kinds of delivery and shopping apps?
                    Natural brings you exactly what you need, when you need it from your
                    favorite stores, directly to your fingertips.
                </p>
                <button className="bg-black text-white py-2 px-4 rounded-lg">Continue with Apple</button>
                <p className="mt-2 text-gray-500">Signup / Login with phone</p>
            </section>
            <main className="p-4 pb-16">
                <section className='mb-6 flex justify-center'>
                    <button className="flex items-center text-lg">
                        <LuPlusCircle />
                        <p className='underline'>Open an account</p>
                    </button>
                </section>
                <section className="mb-6 flex justify-between">
                    <h2 className="font-semibold text-lg">Activity</h2>
                    <LuChevronRight />
                </section>
                <section className="mb-6 flex justify-between">
                    <h2 className="font-semibold text-lg">All positions</h2>
                    <LuChevronRight />
                </section>
                <section className="mb-6">
                    <div className='flex justify-between items-center mb-3'>
                        <h2 className="font-semibold text-lg">Orders snapshot</h2>
                        <div className='flex'>
                            <button className='text-gray-500 mr-2'>See All</button>
                            <LuChevronRight />
                        </div>
                    </div>
                    <div className="p-4 border rounded-lg flex justify-between items-center">
                        <img src='/fidelity.png' className='w-20' alt="Fidelity" />
                        <div>
                            <p className="font-medium">Buy 1 Share of QQQM Limit at $...</p>
                            <p className="text-gray-500">Open Apr-17-2024</p>
                            <p className="">ROTH IRA ********</p>
                        </div>
                    </div>
                </section>
                <section className="mb-6">
                    <h2 className="font-semibold text-lg mb-2">Stay in the know</h2>
                    <div className="flex p-4 border rounded-lg">
                        <img src='/fidelity.png' className='w-12 h-12 mr-4' alt="Fidelity" />
                        <div className='flex flex-col'>
                            <h3 className="font-semibold">Curious about direct indexing?</h3>
                            <p className='text-gray-500'>
                                Learn how this investing strategy enables transparency and choice
                                for your portfolio – and is easier than you think.
                            </p>
                            <a href="#" className="text-green-600">Get our insights</a>
                        </div>
                    </div>
                </section>
                <section className="flex justify-center my-12">
                    <button className="border-2 border-green-600 text-green-600 font-semibold w-full py-3 px-4 rounded-lg">Send us feedback</button>
                </section>
                <footer className="text-center mt-4 text-gray-500">
                    <p>Indicates that the security has not priced today. Some securities, such as mutual funds, are not priced until after the market closes.</p>
                </footer>
            </main>
            <nav className="absolute bottom-0 left-0 right-0 bg-white border-t shadow-md">
                <div className="flex justify-around p-2">
                    <button className="text-green-600 flex flex-col items-center">
                        <LuHome /><span className="text-xs">Home</span>
                    </button>
                    <button className="flex flex-col items-center">
                        <LuLineChart /><span className="text-xs">Investing</span>
                    </button>
                    <button className="flex flex-col items-center">
                        <LuDollarSign /><span className="text-xs">Transact</span>
                    </button>
                    <button className="flex flex-col items-center">
                        <LuCog /><span className="text-xs">Planning</span>
                    </button>
                    <button className="flex flex-col items-center">
                        <LuGrip /><span className="text-xs">Discover</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
`