import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import Colors from '../constants/Colors';
import { Entypo } from '@expo/vector-icons';
import { BottomTabParamList, RootStackParamList } from '../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import HabitHeader from '../components/habit/Header';
import { RouteProp } from '@react-navigation/native';
import { connect } from 'react-redux';
import { ReducerStateProps } from '../services';
import { HabitProps, HabitsActionsProps, HabitEditProps } from '../services/habits/types';
import { setBanner } from '../services/banner/actions';
import { BannerActionsProps } from '../services/banner/types';
import { addCompletedHabit, updateHabit, archiveHabit } from '../services/habits/actions';
import Modal from '../components/habit/ArchiveModal';
import { normalizeHeight, normalizeWidth } from '../utils/styles';
import { cloneDeep, isEqual } from 'lodash';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tracker from '../components/habit/tracker';
import { StyledTextBold, StyledText } from '../components/StyledText';
import HabitBadges from '../components/badges/HabitBadges';
import { consecutiveTools } from '../services/habits/utils/consecutive';
import { getDate } from '../utils/tools';
import { setCongratsBanner } from '../services/banner/actions';

type HabitComNavProps = StackNavigationProp<BottomTabParamList, 'Home'>
type HabitComRouteProps = RouteProp<RootStackParamList, 'Habit'>

interface HabitComProps {
    navigation: HabitComNavProps;
    route: HabitComRouteProps;
    habits: HabitProps[];
    setBanner: BannerActionsProps['setBanner'];
    addCompletedHabit: HabitsActionsProps['addCompletedHabit'];
    updateHabit: HabitsActionsProps['updateHabit'];
    archiveHabit: HabitsActionsProps['archiveHabit'];
    setCongratsBanner: BannerActionsProps['setCongratsBanner'];
}

const HabitCom = ({ navigation, route, habits, setBanner, addCompletedHabit, updateHabit, archiveHabit, setCongratsBanner }: HabitComProps) => {
    const [habit, setHabit] = useState<HabitProps>();
    const [habitEdit, setHabitEdit] = useState<HabitEditProps>();
    const [edit, setEdit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [prevDayWarning, setPrevDayWarning] = useState(false);
    const mount = useRef(false);

    useLayoutEffect(() => {
        mount.current = true;

        navigation.setOptions({
            headerRight: () => {
                if (edit) {
                    return (
                        <View style={{ flexDirection: 'row' }}>
                            {
                                loading ?
                                    <ActivityIndicator size="small" color={Colors.secondary} style={{ marginRight: 5 }} />
                                    :
                                    <>
                                        <Entypo name="save" size={normalizeHeight(30)} color={Colors.secondary} style={{ marginRight: 5 }} onPress={handleSaveEditHabit} />
                                        <Entypo name="cross" size={normalizeHeight(30)} color={Colors.secondary} style={{ marginRight: 5 }} onPress={() => setEdit(false)} />
                                    </>
                            }
                        </View>
                    )
                } else {
                    return <Entypo name="pencil" size={normalizeHeight(30)} color={Colors.secondary} style={{ marginRight: 5 }} onPress={() => setEdit(true)} />
                }
            },
            headerTitle: () => {
                if (edit) {
                    return (
                        <View>
                            <Entypo name="trash" size={normalizeHeight(30)} color={Colors.red} onPress={onArchivePress} style={{ zIndex: 100 }} />
                            <Modal headerText='Are you sure? Once archived, you cannot undo.' onModalResponse={onArchiveModalResponse} showModal={showModal} loading={loading} onClose={onArchivePress} />
                        </View>
                    )
                }
            }
        })

        return () => {
            mount.current = false;
        }
    }, [edit, habitEdit, loading, showModal])

    const handleSaveEditHabit = () => {
        if (habitEdit) {
            setLoading(true);
            updateHabit(habitEdit)
                .then(() => {
                    if (mount.current) {
                        setEdit(false)
                        setLoading(false);
                    }
                })
        } else {
            setEdit(false)
        }
    }

    const onArchivePress = () => setShowModal(showModal ? false : true)

    const onArchiveModalResponse = () => {
        if (habitEdit) {
            setLoading(true);
            archiveHabit(habitEdit.docId)
                .then(() => {
                    mount.current && setLoading(false)
                })
                .catch((err) => {
                    console.log(err)
                    mount.current && setLoading(false)
                })
        } else {
            setShowModal(false)
        }
    }

    useEffect(() => {
        if (!route.params.habitDocId || !route.params.activeDay) {
            setBanner('error', "Sorry, couldn't found the habit id.");
            navigation.goBack()
            return;
        };

        const { habitDocId } = route.params;
        const foundHabit = habits.find((item) => item.docId === habitDocId);

        if (!foundHabit) {
            navigation.goBack();
            return;
        }

        if (habit) {
            handleShowBadgeBanner(habit.consecutive, foundHabit.consecutive);
        }

        setHabit(cloneDeep(foundHabit));

        setHabitEdit({
            docId: foundHabit.docId,
            startTime: foundHabit.startTime,
            endTime: foundHabit.endTime,
            cue: foundHabit.cue,
            locationDes: foundHabit.locationDes,
            notes: foundHabit.notes,
            notificationOn: foundHabit.notificationOn,
            notificationTime: foundHabit.notificationTime
        })

    }, [habits, route.params])

    const handleShowBadgeBanner = (prevConsec: HabitProps['consecutive'], newConsec: HabitProps['consecutive']) => {
        if (isEqual(prevConsec, newConsec)) return;

        const keys = Object.keys(newConsec);

        for (let i = 0; i < keys.length; i++) {
            const newGoal = newConsec[keys[i]];
            const oldGoal = prevConsec[keys[i]];

            if (newGoal.count.length != oldGoal.count.length) {
                if (newGoal.count.length == newGoal.goal) {
                    //accomplished star
                    setCongratsBanner(i, habit ? habit.name : 'Badge')
                    return;
                }
            }
        }
    }

    const handleAddCompletedHabit = (prevDay: boolean, isPrevAction: boolean) => {
        if (!habit) {
            setBanner('error', "Sorry, couldn't found the habit id.");
            navigation.goBack()
            return;
        }

        let todayDate = new Date();
        let yesterday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - 1);
        let paramsDate = new Date(route.params.activeDay)

        if (!consecutiveTools.datesAreOnSameDay(paramsDate, todayDate) && !consecutiveTools.datesAreOnSameDay(paramsDate, yesterday)) {
            setBanner('warning', "Please go back to today or yesterday to complete this habit.");
            return;
        }

        //warn user to complete previous day if haven't done so already
        //isPrevAction indicates the previous day can be taken action upon 
        if (!prevDay && isPrevAction && !prevDayWarning) {
            setBanner('warning', "Please mark yesterday as completed if performed. If not, continue by trying again.")
            setPrevDayWarning(true)
            return;
        }

        addCompletedHabit(habit.docId, prevDay);
    }

    if (!habit || !habitEdit) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size='large' />
            </View>
        )
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <HabitHeader
                    habit={habit}
                    edit={edit}
                    setHabitEdit={setHabitEdit}
                    habitEdit={habitEdit}
                />
                <HabitBadges consecutive={habit.consecutive} />
                <Tracker
                    sequence={habit.sequence}
                    completedHabits={habit.completedHabits}
                    startDate={habit.createdAt}
                    endDate={habit.archivedAt}
                    handleAddCompletedHabit={handleAddCompletedHabit}
                    consecutive={habit.consecutive}
                />
                <View style={styles.dateContainer}>
                    <StyledTextBold style={styles.dateText}>Created on: </StyledTextBold>
                    <StyledText style={styles.dateText}>{getDate(habit.createdAt)}</StyledText>
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    container: {
        flex: 1,
        padding: normalizeWidth(15),
        paddingTop: normalizeHeight(25),
    },
    dateContainer: {
        flexDirection: 'row',
        marginTop: 5
    },
    dateText: {
        fontSize: normalizeWidth(30),
        color: Colors.primary
    }
})

const mapStateToProps = (state: ReducerStateProps) => ({
    habits: state.habits.habits
})

export default connect(mapStateToProps, { setBanner, addCompletedHabit, updateHabit, archiveHabit, setCongratsBanner })(HabitCom);