const express = require('express');
const router = express.Router();
const AIActionLog = require('../Schema/AIActionLogSchema');

router.post('/ai-actions/log', async (req, res) => {
  try {
    const {
      username,
      actionType,
      actionDetails,
      walletSignature,
      status = 'approved'
    } = req.body;

    if (!username || !actionType) {
      return res.status(400).json({
        success: false,
        message: 'Username and actionType are required'
      });
    }

    const actionLog = new AIActionLog({
      username,
      actionType,
      actionDetails,
      walletSignature,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await actionLog.save();

    res.json({
      success: true,
      message: 'Action logged successfully',
      data: actionLog
    });
  } catch (error) {
    console.error('Error logging AI action:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log action',
      error: error.message
    });
  }
});

router.get('/ai-actions/logs/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { limit = 50, status, actionType } = req.query;

    const query = { username };
    
    if (status) {
      query.status = status;
    }
    
    if (actionType) {
      query.actionType = actionType;
    }

    const logs = await AIActionLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const stats = await AIActionLog.aggregate([
      { $match: { username } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap = {};
    stats.forEach(stat => {
      statsMap[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: logs,
      total: logs.length,
      stats: {
        total: logs.length,
        pending: statsMap.pending || 0,
        approved: statsMap.approved || 0,
        executed: statsMap.executed || 0,
        failed: statsMap.failed || 0,
        rejected: statsMap.rejected || 0
      }
    });
  } catch (error) {
    console.error('Error fetching AI action logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs',
      error: error.message
    });
  }
});

router.patch('/ai-actions/log/:logId/status', async (req, res) => {
  try {
    const { logId } = req.params;
    const { status, executionResult } = req.body;

    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (executionResult) {
      updateData.executionResult = executionResult;
    }

    const log = await AIActionLog.findByIdAndUpdate(
      logId,
      updateData,
      { new: true }
    );

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: log
    });
  } catch (error) {
    console.error('Error updating log status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
});

router.delete('/ai-actions/log/:logId', async (req, res) => {
  try {
    const { logId } = req.params;

    const log = await AIActionLog.findByIdAndDelete(logId);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    res.json({
      success: true,
      message: 'Log deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete log',
      error: error.message
    });
  }
});

module.exports = router;
