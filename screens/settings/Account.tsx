import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AsapText, LatoText } from '../../components/StyledText';
import { StyledPrimaryButton, StyledRedButton } from '../../components/StyledButton';
import { firebaseDb, firestoreDb } from '../../firebase';
import { StyledTextInput } from '../../components/StyledTextInput';
import Colors from '../../constants/Colors';
import { RootStackParamList } from '../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { Entypo } from '@expo/vector-icons';
import Database from '../../constants/Database';
import { ScrollView } from 'react-native-gesture-handler';
import { signOut } from '../../services/user/actions';
import { connect } from 'react-redux';
import { UserActionsProps } from '../../services/user/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { normalizeHeight } from '../../utils/styles';


function validateEmail(email: string) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

type AccountNavProps = StackNavigationProp<RootStackParamList, 'Account'>;


const Account = ({ navigation, signOut }: { navigation: AccountNavProps, signOut: UserActionsProps['signOut'] }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Entypo name="log-out" size={24} color={Colors.red} onPress={signOut} style={{ marginRight: 10 }} />
            )
        })
    }, [])

    const sendPasswordResetEmail = () => {
        if (!email) return;
        if (!validateEmail(email)) return alert('Invalid email. Please try again.');
        setLoading(true)
        firebaseDb.auth().sendPasswordResetEmail(email)
            .then(() => {
                alert('A email was sent to your email address. Please follow the directions in the email to reset your password.');
                setLoading(false)
            })
            .catch((error) => {
                switch (error.code) {
                    case 'auth/invalid-email':
                    case 'auth/user-not-found':
                        alert('The email you provided was incorrect. Please try again.');
                        break;
                    default:
                        alert('A unexpected error occurred. Please try again.');
                }
                setLoading(false)
            })
    }

    const deleteAccount = async () => {
        const { currentUser } = firebaseDb.auth();
        if (currentUser) {
            setLoading(true)
            try {
                await firestoreDb.collection(Database.Users).doc(currentUser.uid).delete()
                await currentUser.delete()
            } catch (err) {
                console.log(err);
                alert("Failed. Please try to log out and log in again.")
                setLoading(false)
            }

        } else {
            alert("Please try to log out and log in again.")
        }
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                <View style={styles.section}>
                    <AsapText style={styles.headerText}>Notification</AsapText>
                    <LatoText style={styles.subText}>You can update your notification settings by navigating to your settings on your phone.</LatoText>
                    <LatoText style={styles.subText}>If you want to turn off/on a notification for a habit, navigate to the habit, tap the edit icon (pencil icon) located in the top right corner, and tap the notification icon (bell icon) to turn off/on.</LatoText>
                </View>
                <View style={styles.section}>
                    <AsapText style={styles.headerText}>Password</AsapText>
                    <AsapText style={styles.subText}>Send Email To Reset Password</AsapText>
                    <StyledTextInput
                        style={styles.input}
                        placeholder='Confirm Email Address'
                        textContentType='emailAddress'
                        autoCapitalize={"none"}
                        onChangeText={(text) => setEmail(text)}
                    />
                    <StyledPrimaryButton text={loading ? <ActivityIndicator color={Colors.white} size='small' /> : 'Send'} style={styles.button} onPress={sendPasswordResetEmail} />
                </View>
                <View style={styles.section}>
                    <AsapText style={styles.headerText}>Delete Account</AsapText>
                    <StyledRedButton text={loading ? <ActivityIndicator color={Colors.white} size='small' /> : 'Remove'} style={styles.button} onPress={deleteAccount} />
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        marginTop: normalizeHeight(40)
    },
    section: {
        margin: 10
    },
    headerText: {
        fontSize: 25,
        margin: 10,
        textAlign: 'center',
        color: Colors.white
    },
    subText: {
        fontSize: 14,
        textAlign: 'center',
        margin: 10,
        color: Colors.white
    },
    input: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.primary,
        fontSize: 12,
        padding: 10,
        paddingTop: 10,
        color: Colors.white,
        margin: 10
    },
    button: {
        margin: 10
    }
})

export default connect(null, { signOut })(Account);

