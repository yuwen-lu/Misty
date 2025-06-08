export const BookList: string = `() => {
  return (
    <div className="bg-black w-full min-w-md text-white p-4 font-sans">
    <div className="section mb-5">
        <div className="text-xl font-semibold mt-2 my-4">My Books</div>
        <div className="flex flex-col justify-items-center items-center rounded-lg bg-gray-800">
          <div className="flex items-center justify-between pl-4 py-2 w-full">
            <LuHourglass className="text-gray-400 mr-4" size={40} />
            <div className="flex items-center space-x-3 py-2 pr-3 border-0 border-b border-gray-500/90 w-full">
              <span className="w-72">A Brief History of Time</span>
              <LuInfo className="text-blue-500" size={15} />
            </div>
          </div>
          <div className="flex items-center justify-between pl-4 py-2 w-full">
            <LuCompass className="text-gray-400 mr-4" size={40} />
            <div className="flex items-center space-x-3 py-2 pr-3 border-0 border-b border-gray-500/90 w-full">
              <span className="w-72">Sapiens: A Brief History of Humankind</span>
              <LuInfo className="text-blue-500" size={15} />
            </div>
          </div>
          <div className="flex items-center justify-between pl-4 py-2 w-full">
            <LuFeather className="text-gray-400 mr-4" size={40} />
            <div className="flex items-center space-x-3 py-2 pr-3 border-0 border-b border-gray-500/90 w-full">
              <span className="w-72">Thinking, Fast and Slow</span>
              <LuInfo className="text-blue-500" size={15} />
            </div>
          </div>
          <div className="flex items-center justify-between pl-4 py-2 w-full">
            <LuScroll className="text-gray-400 mr-4" size={40} />
            <div className="flex items-center space-x-3 py-2 pr-3 border-0 w-full">
              <span className="w-72">The Selfish Gene</span>
              <LuInfo className="text-blue-500" size={15} />
            </div>
          </div>
        </div>
      </div>
      <div className="section mb-5">
        <div className="text-xl font-semibold mt-2 my-4">Favorite Books</div>
        <div className="flex flex-col justify-items-center items-center rounded-lg bg-gray-800">
          <div className="flex items-center justify-between pl-4 py-2 w-full">
            <LuCable className="text-gray-400 mr-4" size={40} />
            <div className="flex items-center space-x-3 py-2 pr-3 border-0 border-b border-gray-500/90 w-full">
              <span className="w-72">The Catcher in the Rye</span>
              <LuInfo className="text-blue-500" size={15} />
            </div>
          </div>
          <div className="flex items-center justify-between pl-4 py-2 w-full">
            <LuBook className="text-gray-400 mr-4" size={40} />
            <div className="flex items-center space-x-3 py-2 pr-3 border-0 border-b border-gray-500/90 w-full">
              <span className="w-72">To Kill a Mockingbird</span>
              <LuInfo className="text-blue-500" size={15} />
            </div>
          </div>
          <div className="flex items-center justify-between pl-4 py-2 w-full">
            <LuGlasses className="text-gray-400 mr-4" size={40} />
            <div className="flex items-center space-x-3 py-2 pr-3 border-0 border-b border-gray-500/90 w-full">
              <span className="w-72">1984 by George Orwell</span>
              <LuInfo className="text-blue-500" size={15} />
            </div>
          </div>
          <div className="flex items-center justify-between pl-4 py-2 w-full">
            <LuPen className="text-gray-400 mr-4" size={40} />
            <div className="flex items-center space-x-3 py-2 pr-3 border-0 w-full">
              <span className="w-72">Pride and Prejudice</span>
              <LuInfo className="text-blue-500" size={15} />
            </div>
          </div>
        </div>
      </div>

      <div className="section mb-5">
        <div className="text-xl font-semibold mt-2 my-4">Want to Read</div>
        <div className="flex flex-col justify-items-center items-center rounded-lg bg-gray-800">
          <div className="flex items-center justify-between pl-4 py-2 w-full">
            <LuBrush className="text-gray-400 mr-4" size={40} />
            <div className="flex items-center space-x-3 py-2 pr-3 border-0 border-b border-gray-500/90 w-full">
              <span className="w-72">The Great Gatsby</span>
              <LuInfo className="text-blue-500" size={15} />
            </div>
          </div>
          <div className="flex items-center justify-between pl-4 py-2 w-full">
            <LuBrainCog className="text-gray-400 mr-4" size={40} />
            <div className="flex items-center space-x-3 py-2 pr-3 border-0 border-b border-gray-500/90 w-full">
              <span className="w-72">Moby Dick</span>
              <LuInfo className="text-blue-500" size={15} />
            </div>
          </div>
          <div className="flex items-center justify-between pl-4 py-2 w-full">
            <LuBookOpen className="text-gray-400 mr-4" size={40} />
            <div className="flex items-center space-x-3 py-2 pr-3 border-0 border-b border-gray-500/90 w-full">
              <span className="w-72">War and Peace</span>
              <LuInfo className="text-blue-500" size={15} />
            </div>
          </div>
          <div className="flex items-center justify-between pl-4 py-2 w-full">
            <LuSquare className="text-gray-400 mr-4" size={40} />
            <div className="flex items-center space-x-3 py-2 pr-3 border-0 w-full">
              <span className="w-72">The Odyssey</span>
              <LuInfo className="text-blue-500" size={15} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

`
