# Pain Recognition - Quick Start Checklist

## ✅ Pre-Setup Checklist

Before starting, ensure you have:
- [ ] MySQL running and accessible
- [ ] Python 3.8+ installed
- [ ] Node.js and npm installed
- [ ] Backend and frontend working (basic rehab system)
- [ ] Camera/webcam available

## 🚀 Installation Steps

### Step 1: Automated Setup (Recommended)
- [ ] Run `setup-pain-recognition.bat`
- [ ] Wait for completion message
- [ ] Check for any error messages

### Step 2: Manual Setup (If automated fails)
- [ ] Open terminal in `backend` folder
- [ ] Run: `pip install scipy==1.11.4`
- [ ] Run: `python migrate_pain_tracking.py`
- [ ] Verify "MIGRATION COMPLETED SUCCESSFULLY" message

## 🧪 Testing Checklist

### Backend Tests
- [ ] Start backend: `python main.py`
- [ ] Check console for errors
- [ ] Look for: "MediaPipe Face Mesh initialized"
- [ ] Verify: "Pain Recognition Engine loaded"
- [ ] No import errors for `PainRecognitionEngine`

### Database Tests
- [ ] Open MySQL client
- [ ] Check `sessions` table has `pain_detected` column
- [ ] Check `sessions` table has `max_pain_level` column
- [ ] Verify `pain_events` table exists
- [ ] Run: `DESCRIBE pain_events;` - should show 7 columns

### Frontend Tests
- [ ] Start frontend: `npm run dev`
- [ ] No TypeScript errors in console
- [ ] Check browser console for errors
- [ ] Navigate to Exercise page
- [ ] Start an exercise
- [ ] Verify camera activates

### Pain Detection Tests
- [ ] Face clearly visible in frame
- [ ] Good lighting on face
- [ ] Try normal expression - should show no pain
- [ ] Try squinting eyes - should detect pain
- [ ] Try opening mouth wide - should detect pain
- [ ] Try frowning - should detect pain
- [ ] Verify alert appears on screen
- [ ] Check alert color (yellow/orange/red)
- [ ] Confirm voice alert plays
- [ ] For severe pain: verify dialog appears

### Data Persistence Tests
- [ ] Complete an exercise session
- [ ] Stop the session
- [ ] Check `sessions` table for pain data
- [ ] Verify `pain_detected` is TRUE/FALSE correctly
- [ ] Check `max_pain_level` value
- [ ] Query `pain_events` table
- [ ] Verify events logged with correct timestamps

### Analytics Tests
- [ ] Go to Patient Dashboard
- [ ] Scroll to Pain Analytics section
- [ ] Verify pain statistics display
- [ ] Check pain level chart renders
- [ ] Check pain by exercise chart renders
- [ ] Verify recommendations show when pain detected

## 🎯 Feature Verification

### Real-Time Detection
- [ ] Pain alerts appear within 2 seconds
- [ ] Alerts disappear when expression changes
- [ ] No false alerts during normal exercise
- [ ] Multiple pain indicators detected correctly

### Alert System
- [ ] Visual overlay appears
- [ ] Correct color for pain level
- [ ] Voice message plays
- [ ] Dialog appears for moderate/severe
- [ ] Auto-pause works for severe pain

### Data Logging
- [ ] All pain events saved to database
- [ ] Session summary includes pain data
- [ ] Pain indicators array saved correctly
- [ ] Timestamps accurate

### Analytics Dashboard
- [ ] Summary cards show correct counts
- [ ] Charts render without errors
- [ ] Data updates after new sessions
- [ ] Recommendations relevant to pain level

## 🔧 Troubleshooting Checklist

### If Pain Not Detected
- [ ] Check face is fully visible
- [ ] Improve lighting (face should be well-lit)
- [ ] Try more exaggerated expressions
- [ ] Check console for face mesh errors
- [ ] Verify MediaPipe Face Mesh initialized

### If Too Many False Alerts
- [ ] Check for bright/dark background
- [ ] Remove objects that look like faces
- [ ] Adjust lighting (avoid harsh shadows)
- [ ] Consider increasing thresholds in code
- [ ] Check for camera auto-adjust issues

### If Database Errors
- [ ] Verify MySQL is running
- [ ] Check credentials in `migrate_pain_tracking.py`
- [ ] Ensure `rehab_v3` database exists
- [ ] Try running migration again
- [ ] Check MySQL error logs

### If Frontend Errors
- [ ] Clear browser cache
- [ ] Restart frontend dev server
- [ ] Check for TypeScript errors
- [ ] Verify all imports resolved
- [ ] Check WebSocket connection

## 📊 Acceptance Criteria

Pain recognition is working correctly when:
- ✅ Face is detected and processed in real-time
- ✅ Pain alerts appear for pain expressions
- ✅ No alerts during normal expressions
- ✅ Severe pain triggers auto-pause option
- ✅ Pain events saved to database
- ✅ Analytics display pain statistics
- ✅ Charts render correctly
- ✅ No console errors
- ✅ Performance impact < 10ms per frame
- ✅ System stable for 10+ minute sessions

## 🎓 User Training Checklist

### For Patients
- [ ] Explain pain detection feature
- [ ] Show example of pain alert
- [ ] Demonstrate auto-pause
- [ ] Emphasize privacy (no images stored)
- [ ] Encourage reporting pain regardless
- [ ] Show how to view pain history

### For Medical Staff
- [ ] Explain how pain detection works
- [ ] Show pain analytics dashboard
- [ ] Review pain level classifications
- [ ] Discuss limitations
- [ ] Demonstrate how to interpret data
- [ ] Train on adjusting exercise plans

## 📝 Documentation Checklist

- [ ] Read `PAIN_RECOGNITION_SUMMARY.md`
- [ ] Review `PAIN_RECOGNITION_GUIDE.md`
- [ ] Understand `PAIN_RECOGNITION_ARCHITECTURE.md`
- [ ] Check code comments in pain_recognition.py
- [ ] Review database schema changes
- [ ] Understand API response format

## 🚦 Production Readiness

Before deploying to production:
- [ ] All tests pass
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Data logging verified
- [ ] Analytics working
- [ ] User training completed
- [ ] Documentation reviewed
- [ ] Privacy policy updated
- [ ] Patient consent obtained
- [ ] Medical staff trained
- [ ] Backup plan in place
- [ ] Monitoring configured

## 📈 Post-Deployment Monitoring

After deployment, monitor:
- [ ] Pain detection accuracy
- [ ] False positive rate
- [ ] False negative rate
- [ ] User feedback
- [ ] Database growth
- [ ] Performance metrics
- [ ] Error rates
- [ ] Alert frequency

## 🔄 Maintenance Schedule

Weekly:
- [ ] Review pain detection accuracy
- [ ] Check for false positives
- [ ] Monitor database size
- [ ] Review user feedback

Monthly:
- [ ] Analyze pain trends
- [ ] Adjust thresholds if needed
- [ ] Update documentation
- [ ] Train new staff

Quarterly:
- [ ] Comprehensive system review
- [ ] Performance optimization
- [ ] Feature enhancements
- [ ] User satisfaction survey

## ✨ Success Indicators

Pain recognition is successful when:
- ✅ Patients feel safer during exercises
- ✅ Doctors have useful pain data
- ✅ Early pain detection prevents injuries
- ✅ Exercise plans better adjusted
- ✅ Patient satisfaction increases
- ✅ System reliability > 95%
- ✅ False positive rate < 5%
- ✅ User adoption > 80%

## 📞 Support Resources

If you need help:
1. Check troubleshooting section above
2. Review `PAIN_RECOGNITION_GUIDE.md`
3. Check backend terminal logs
4. Inspect browser console
5. Verify database state
6. Test with different users
7. Check camera and lighting

## 🎉 Completion

When all items checked:
- ✅ Pain recognition fully operational
- ✅ All tests passing
- ✅ Users trained
- ✅ Documentation complete
- ✅ Monitoring active
- ✅ Ready for production use!

---

**Checklist Version**: 1.0  
**Last Updated**: February 2026  
**Status**: Ready for Use
