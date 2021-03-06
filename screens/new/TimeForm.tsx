import React, { useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, FlatList } from 'react-native';
import Colors from '../../constants/Colors';
import { StyledPrimaryButton, StyledDisabledButton, StyledSecondaryButton } from '../../components/StyledButton';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StyledText, StyledTextBold, StyledTextMedium } from '../../components/StyledText';
import { Entypo } from '@expo/vector-icons';
import { formatTime, renderSequenceValue } from '../../utils/tools';
import { HabitProps } from '../../services/habits/types';
import { normalizeHeight, normalizeWidth } from '../../utils/styles';

interface Props {
    habits: HabitProps[];
    startTime: Date;
    endTime: Date;
    setStartTime: (d: Date) => void;
    setEndTime: (d: Date) => void;
    handlePreviousStep: () => void;
    handleNextStep: () => void;
}

export default ({ habits, startTime, endTime, setStartTime, setEndTime, handlePreviousStep, handleNextStep }: Props) => {
    const [timeStep, setTimeStep] = useState(0);
    const habitListHeight: any = useRef(new Animated.Value(0)).current;
    const habitListWidth = useRef(new Animated.Value(0)).current;

    const handleHabitList = () => {
        if (habitListHeight._value > 0) {
            Animated.parallel([
                Animated.timing(habitListHeight, {
                    useNativeDriver: false,
                    toValue: 0,
                    easing: Easing.inOut(Easing.circle),
                    duration: 500
                }),
                Animated.timing(habitListWidth, {
                    useNativeDriver: false,
                    toValue: 2,
                    easing: Easing.inOut(Easing.circle),
                    duration: 500
                })
            ]).start(() => habitListWidth.setValue(0))
        } else {
            Animated.parallel([
                Animated.timing(habitListHeight, {
                    useNativeDriver: false,
                    toValue: 100,
                    easing: Easing.inOut(Easing.circle),
                    duration: 500
                }),
                Animated.timing(habitListWidth, {
                    useNativeDriver: false,
                    toValue: 1,
                    easing: Easing.inOut(Easing.circle),
                    duration: 500
                })
            ]).start()
        }
    }

    const handleNext = () => {
        if (timeStep < 1) {
            setTimeStep(1)
        } else if (timeStep > 0) {
            handleNextStep()
        }
    }
    const handlePrevious = () => {
        if (timeStep < 1) {
            handlePreviousStep()
        } else if (timeStep > 0) {
            setTimeStep(0)
        }
    }

    return (
        <View style={styles.container}>
            <StyledText style={styles.infoText}>in 5 minute intervals.</StyledText>
            <StyledTextBold style={styles.questionText}>What Time In The Day Do You Want To Implement This Habit?</StyledTextBold>
            <View style={styles.timeContainer}>
                <Entypo name="list" size={24} color={Colors.primary} onPress={handleHabitList} style={{ position: 'absolute', zIndex: 10 }} />
                <Animated.View
                    style={[{
                        height: habitListHeight,
                        width: habitListWidth.interpolate({ inputRange: [0, 1, 2], outputRange: ['0%', '100%', '0%'] }),
                        backgroundColor: Colors.white,
                        borderRadius: 5,
                        top: -10
                    }]}
                >
                    <FlatList
                        data={habits}
                        keyExtractor={(item, index) => item.docId}
                        ListEmptyComponent={<StyledText style={styles.habitListText}>No Habits</StyledText>}
                        style={styles.habitContainer}
                        contentContainerStyle={styles.habitList}
                        ListHeaderComponent={() => (
                            <View>
                                <View style={styles.habitListContainer}>
                                    <StyledTextBold style={styles.habitListText}>Name</StyledTextBold>
                                    <StyledTextBold style={styles.habitListText}>Sequence</StyledTextBold>
                                    <StyledTextBold style={styles.habitListText}>Time</StyledTextBold>
                                </View>
                                <View style={styles.underline} />
                            </View>
                        )}
                        renderItem={({ item }) => (
                            <View style={styles.habitListContainer}>
                                <StyledText style={styles.habitListText}>{item.name}</StyledText>
                                <StyledText style={styles.habitListText}>{item.sequence.type} {renderSequenceValue(item)}</StyledText>
                                <StyledTextMedium style={styles.habitListText}>{formatTime(item.startTime)} - {formatTime(item.endTime)}</StyledTextMedium>
                            </View>
                        )}
                    />
                </Animated.View>
                <StyledTextBold style={styles.timeText}>{timeStep > 0 ? "End Time" : "Start Time"}</StyledTextBold>
                <View style={styles.datePickerContainer}>
                    <DateTimePicker
                        value={timeStep > 0 ? endTime : startTime}
                        minuteInterval={5}
                        mode='time'
                        is24Hour={true}
                        display="spinner"
                        onChange={(e: any, date: any) => timeStep > 0 ? setEndTime(date) : setStartTime(date)}
                        style={styles.pickerContainer}
                        textColor={Colors.primary}
                    />
                </View>
            </View>
            <View style={styles.buttonContainer}>
                <StyledSecondaryButton text='Previous' style={{ flex: .4 }} onPress={handlePrevious} />
                {
                    !(() => {
                        if (timeStep > 0 && endTime <= startTime) {
                            return false
                        } else {
                            return true
                        }
                    })() ?
                        <StyledDisabledButton text='Next' style={{ flex: .4 }} />
                        : <StyledPrimaryButton text='Next' style={{ flex: .4 }} onPress={handleNext} />
                }
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.contentBg,
        padding: normalizeWidth(15),
        height: normalizeHeight(2),
        borderRadius: 20,
        justifyContent: 'space-between'
    },
    underline: {
        height: 1,
        width: '100%',
        backgroundColor: Colors.contentBg,
    },
    habitList: {
        padding: 5,
        paddingLeft: 10
    },
    habitContainer: {
        flex: 1
    },
    pickerContainer: {
        flex: .5,
        height: '100%'
    },
    habitListContainer: {
        flexDirection: 'row',
        margin: 5
    },
    habitListText: {
        flex: 1,
        textAlign: 'center',
        color: Colors.primary,
        fontSize: normalizeWidth(30),
        margin: 5,
        flexWrap: 'wrap'
    },
    timeText: {
        fontSize: normalizeWidth(20),
        color: Colors.primary
    },
    timeContainer: {
        paddingTop: normalizeHeight(20),
        flex: 1
    },
    datePickerContainer: {
        flexDirection: 'row',
        flex: .5,
        alignItems: 'center',
        left: -10
    },
    buttonContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    questionText: {
        textTransform: 'capitalize',
        fontSize: normalizeWidth(15),
        color: Colors.primary
    },
    infoText: {
        fontSize: normalizeWidth(30),
        color: Colors.primary,
    },
})

