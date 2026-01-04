import React from "react";
import { Search, Filter, ChevronDown, List, Grid, Calendar, Clipboard, CheckCircle, Clock as ClockIcon, ListChecks } from "lucide-react";

const TaskControls = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  viewMode,
  handleViewModeToggle,
  taskCategories,
  handleCategoryToggle,
}) => (
  <div className="space-y-4 mb-6">
    {/* Search and Filters Bar */}
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks by title, description, or user..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
          {/* Status Filter */}
          <div className="relative min-w-[140px]">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 w-4 h-4 pointer-events-none z-10" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none bg-gray-900 border border-gray-700 hover:border-emerald-500 rounded-lg pl-9 pr-10 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all"
            >
              <option value="all">All Status</option>
              <option value="completed">✓ Completed</option>
              <option value="inprogress">⟳ In Progress</option>
              <option value="pending">○ Pending</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          {/* Sort Order */}
          <div className="relative min-w-[140px]">
            <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 w-4 h-4 pointer-events-none z-10" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full appearance-none bg-gray-900 border border-gray-700 hover:border-emerald-500 rounded-lg pl-9 pr-10 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          {/* View Mode Toggle */}
          <button
            onClick={handleViewModeToggle}
            className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-emerald-500 p-2.5 rounded-lg text-gray-300 hover:text-white transition-all flex-shrink-0"
            title={viewMode === "grid" ? "Switch to List View" : "Switch to Grid View"}
          >
            {viewMode === "grid" ? (
              <List className="w-5 h-5" />
            ) : (
              <Grid className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>

    {/* Category Filter Pills */}
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleCategoryToggle("all")}
        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
          taskCategories.all 
            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
            : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
        }`}
      >
        <ListChecks className="w-4 h-4" />
        All Tasks
      </button>
      <button
        onClick={() => handleCategoryToggle("meetings")}
        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
          taskCategories.meetings 
            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
            : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
        }`}
      >
        <Calendar className="w-4 h-4" />
        Meetings
      </button>
      <button
        onClick={() => handleCategoryToggle("selfTasks")}
        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
          taskCategories.selfTasks 
            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
            : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
        }`}
      >
        <Clipboard className="w-4 h-4" />
        Self Tasks
      </button>
      <button
        onClick={() => handleCategoryToggle("completed")}
        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
          taskCategories.completed 
            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
            : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
        }`}
      >
        <CheckCircle className="w-4 h-4" />
        Completed
      </button>
      <button
        onClick={() => handleCategoryToggle("pending")}
        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
          taskCategories.pending 
            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
            : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
        }`}
      >
        <ClockIcon className="w-4 h-4" />
        Pending
      </button>
    </div>
  </div>
);

export default TaskControls; 