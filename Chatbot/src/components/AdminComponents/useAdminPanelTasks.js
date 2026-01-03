import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Groq from 'groq-sdk';

const useAdminPanelTasks = (userData) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [userDescriptions, setUserDescriptions] = useState({});
  const [userInfoLoading, setUserInfoLoading] = useState(false);
  const [userInfoError, setUserInfoError] = useState("");

  useEffect(() => {
    if (userData?.user?.tasks) {
      setTasks(userData.user.tasks);
    }
  }, [userData?.user?.tasks]);

  const fetchTasks = () => {
    setTasks(userData.user.tasks);
  };

  const toggleTaskStatus = async (task) => {
    try {
      setLoading(true);
      const newStatus =
        task.status === "inprogress" ? "completed" : "inprogress";
      const response = await axios.patch(
        `${import.meta.env.VITE_BACKEND}/tasks`,
        {
          status: newStatus,
          userId: userData.user.username,
          uniqueTaskId: task.uniqueTaskId,
        }
      );
      if (response.data && response.data.task) {
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.uniqueTaskId === task.uniqueTaskId
              ? { ...t, status: newStatus }
              : t
          )
        );
        toast.success(`Task marked as ${newStatus}`);
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    } finally {
      setLoading(false);
    }
  };

  const generateUserDescription = async (prompt) => {
    try {
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqApiKey) {
        return "No API key available to generate description.";
      }
      const groq = new Groq({ apiKey: groqApiKey, dangerouslyAllowBrowser: true });
      const descriptionPrompt = `
        Based on the following information about a user, create a brief 5-line description highlighting key aspects of their personality, background, and interests:
        
        ${prompt}
        
        Keep the description concise, informative, and professional.
      `;
      const result = await groq.chat.completions.create({
        messages: [{ role: 'user', content: descriptionPrompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 512
      });
      return result.choices[0]?.message?.content || 'Could not generate description.';
    } catch (error) {
      console.error("Error generating user description:", error);
      return "Could not generate user description at this time.";
    }
  };

  const handleViewUserDetails = async (task) => {
    if (expandedUser === task._id) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(task._id);
    setUserInfoLoading(true);
    setUserInfoError("");
    if (
      !userDescriptions[task._id] &&
      task.presentUserData &&
      task.presentUserData.prompt
    ) {
      try {
        const description = await generateUserDescription(
          task.presentUserData.prompt
        );
        setUserDescriptions((prev) => ({
          ...prev,
          [task._id]: description,
        }));
        setUserInfoError("");
      } catch (err) {
        setUserInfoError("Failed to generate user description.");
      }
    }
    setUserInfoLoading(false);
  };

  const handleExpandTask = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  return {
    tasks,
    setTasks,
    loading,
    setLoading,
    error,
    setError,
    fetchTasks,
    toggleTaskStatus,
    expandedTask,
    setExpandedTask,
    expandedUser,
    setExpandedUser,
    userDescriptions,
    setUserDescriptions,
    handleViewUserDetails,
    handleExpandTask,
    userInfoLoading,
    userInfoError,
    setUserInfoLoading,
    setUserInfoError,
  };
};

export default useAdminPanelTasks; 