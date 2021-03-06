import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import Colors from '../../../constants/Colors';
import { normalizeWidth } from '../../../utils/styles';
import { CompletedHabitsProps, HabitProps, SequenceType } from '../../../services/habits/types';
import TrackItem from './components/TrackItem';
import { TrackProps } from './types';
import { consecutiveTools } from '../../../services/habits/utils/consecutive';
import ActionItem from './components/ActionItem';
import WarningActionItem from './components/WarningActionItem';

interface Props {
    completedHabits: CompletedHabitsProps[];
    sequence: HabitProps['sequence'];
    handleAddCompletedHabit: (prevDay: boolean, isPrevAction: boolean) => void;
    startDate: Date;
    endDate?: Date;
    consecutive: HabitProps['consecutive'];
}

type DataArray = Array<{
    date: Date,
    type: TrackProps['type'],
    missCountRows?: number,
    badge?: {
        color: string;
        outline: boolean;
    }
}>

type BadgeProps = Array<{
    date: Date;
    key: string;
    color: string;
    outline: boolean;
}>


const Tracker = ({ completedHabits, sequence, startDate, consecutive, endDate, handleAddCompletedHabit }: Props) => {
    const [data, setData] = useState<DataArray>();
    const isPrevAction = useRef(false);


    const isSameDate = (d1: Date, d2: Date) => {
        return (d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate())
    }

    const getBadgeData = useCallback(() => {
        let badgeData: BadgeProps = [];

        Object.keys(consecutive).forEach((goalKey, i) => {
            const { count, goal } = consecutive[goalKey];
            if (count.length > 0 && count.length === goal && goal > 0) {
                let color = '';
                let outline = false;

                switch (goalKey) {
                    case 'one':
                        color = Colors.primary;
                        outline = true;
                        break;
                    case 'two':
                        color = Colors.primary
                        outline = false;
                        break;
                    case 'three':
                        color = Colors.yellow
                        outline = true;
                        break;
                    case 'four':
                    default:
                        color = Colors.yellow
                        outline = false
                        break;
                }

                badgeData.unshift({
                    date: count[count.length - 1].dateCompleted,
                    key: goalKey,
                    color,
                    outline
                })
            }
        })

        return badgeData
    }, [consecutive])

    const populateData = useCallback((diffInDays: number, dataEndDate: Date, badgeData: BadgeProps) => {
        //check to see if other than daily
        let preparedData: DataArray = [];
        let missCount = 0;
        let missSDate;

        for (let i = diffInDays; i >= 0; i--) {
            let cDate = new Date(dataEndDate.getFullYear(), dataEndDate.getMonth(), dataEndDate.getDate() - i);
            //check to see if non daily sequence type
            //if not found skip this date
            //if found continue
            //be aware of miss count
            let cTargetDay = sequence.type === SequenceType.monthly ? cDate.getDate() : cDate.getDay();
            let seqIdx = sequence.value.find((num) => num === cTargetDay);

            if (sequence.type !== SequenceType.daily) {
                if (seqIdx === undefined) continue;
            }

            //check if completed
            let foundCompleted = completedHabits.find(({ dateCompleted }) => {
                return isSameDate(dateCompleted, cDate)
            })

            if (foundCompleted) {
                //end misscount
                if (missSDate) {
                    preparedData.unshift({
                        date: missSDate,
                        type: 'miss',
                        missCountRows: missCount - 5
                    })
                }

                //check if set badge 
                let isBadgeItem = badgeData.find((b) => foundCompleted && isSameDate(b.date, foundCompleted.dateCompleted))

                if (isBadgeItem) {
                    preparedData.unshift({
                        date: cDate,
                        type: 'badge',
                        badge: isBadgeItem
                    })
                } else {
                    preparedData.unshift({
                        date: cDate,
                        type: 'check'
                    })
                }

                //reset missCount and missSDate
                missCount = 0;
                missSDate = undefined;
                continue;
            }

            //check if multiple misses
            if (missCount) {
                //check if last item
                if (i < 1) {
                    //always able to complete the previous day dispite a miss or not
                    //get first item and update it to be an action warning
                    // the item should be warning
                    if (preparedData[0].type !== 'action') {
                        preparedData[0] = {
                            ...preparedData[0],
                            type: 'action-warning'
                        }
                        //use to indicate prev day might still need to be completed
                        isPrevAction.current = true;

                    }
                    preparedData.unshift({
                        date: cDate,
                        type: 'action'
                    })
                    break;
                }

                //missed twice
                if (missCount < 5) {
                    preparedData.unshift({
                        date: cDate,
                        type: 'miss'
                    })
                }

                if (missCount === 5) {
                    missSDate = cDate
                }

                missCount++
                continue;
            }

            if (i < 1) {
                preparedData.unshift({
                    date: cDate,
                    type: 'action'
                });
                break;
            } else {
                preparedData.unshift({
                    date: cDate,
                    type: 'warning'
                })
            }
            missCount++
        }

        return preparedData
    }, [completedHabits])

    useEffect(() => {
        const badgeData: BadgeProps = getBadgeData();
        //get the difference between today and the start date
        const dataEndDate = endDate ? endDate : new Date()
        const diffInDays = consecutiveTools.getDiffBetweenDates(startDate, dataEndDate)

        const preparedData: DataArray = populateData(diffInDays, dataEndDate, badgeData)

        setData(preparedData)

    }, [completedHabits, endDate, startDate, getBadgeData, populateData])

    const onCompletedHabit = (prevDay: boolean) => {
        handleAddCompletedHabit(prevDay, isPrevAction.current)
    }

    return (
        <View style={styles.container}>
            <FlatList
                horizontal={false}
                data={data}
                numColumns={5}
                keyExtractor={(item, index) => item.date.toTimeString() + index}
                style={{ flex: 1 }}
                contentContainerStyle={styles.contentContainerStyle}
                columnWrapperStyle={styles.columnWrapperStyle}
                renderItem={({ item }) => {
                    const dateString = (item.date.getMonth() + 1) + '/' + item.date.getDate();

                    if (item.type === 'action') {
                        return (
                            <View style={styles.itemContainer}>
                                <ActionItem dateString={dateString} handleAddCompletedHabit={onCompletedHabit} />
                            </View>
                        )
                    }

                    if (item.type === 'action-warning') {
                        return (
                            <View style={styles.itemContainer}>
                                <WarningActionItem dateString={dateString} handleAddCompletedHabit={onCompletedHabit} />
                            </View>
                        )
                    }

                    return (
                        <View style={styles.itemContainer}>
                            <TrackItem
                                type={item.type}
                                dateString={dateString}
                                badge={item.badge}
                                missCountRows={item.missCountRows}
                            />
                        </View>
                    )
                }}
            />

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.contentBg,
        padding: normalizeWidth(30),
        flex: 1,
        borderRadius: 10
    },
    contentContainerStyle: {
        alignItems: 'flex-start'
    },
    columnWrapperStyle: {
        marginBottom: normalizeWidth(30)
    },
    itemContainer: {
        marginLeft: (normalizeWidth(30) / 2),
        marginRight: (normalizeWidth(30) / 2)
    }
})

export default Tracker;