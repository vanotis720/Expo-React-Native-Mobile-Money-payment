import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, Alert, ActivityIndicator, Image, TouchableOpacity, ScrollView } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import axios from 'axios';


export default function App() {
	const [phone, setPhone] = useState('');
	const [surname, setSurname] = useState('');
	const [amount, setAmount] = useState('');
	const [loading, setLoading] = useState(false);
	const [transactionResult, setTransactionResult] = useState(null);

	const handleSubmit = async () => {
		if (!phone || !amount) {
			Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
			return;
		}

		setLoading(true);

		try {
			const res = await axios.post('http://192.168.1.193:8008/api/donation', {
				phone,
				surname,
				amount: parseInt(amount),
			});

			console.log(res);

			if (res.data && res.data.payment_url) {
				await WebBrowser.openBrowserAsync(res.data.payment_url);
			}
			else {
				Alert.alert('Erreur', 'Aucune URL de paiement fournie.');
			}
		}
		catch (error) {
			console.log(error);

			Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi du don. Veuillez réessayer plus tard.');
		}

		setLoading(false);
	}

	const handleBackToForm = () => {
		setAmount('');
		setPhone('');
		setSurname('');
		setTransactionResult(null);
	}

	useEffect(() => {
		const subscription = Linking.addEventListener('url', async ({ url }) => {
			if (url.startsWith('donationtestapp://close')) {
				WebBrowser.dismissBrowser();

				const urlParams = Linking.parse(url);
				const transaction_id = urlParams.queryParams.transaction_id;

				if (transaction_id) {
					try {
						const res = await axios.get(`http://192.168.1.193:8008/api/donation/${transaction_id}/status`);
						setTransactionResult(res.data);
					}
					catch (error) {
						console.error('Erreur lors de la récupération du statut de la transaction:', error);
						setTransactionResult({ error: 'Impossible de récupérer le statut de la transaction. Veuillez réessayer plus tard.' });
					}
				}
			}
		});

		return () => subscription.remove();
	}, [])

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<StatusBar style="auto" />
			<Image source={require('./assets/logo.png')} style={styles.logo} />
			<Text style={styles.title}>Faire un don</Text>
			{
				transactionResult ? (
					<View style={styles.resultCard}>
						{transactionResult.error ? (
							<Text style={styles.errorText}>{transactionResult.error}</Text>
						) : (
							<>
								<Text style={styles.statusTitle}>Statut de la transaction</Text>
								<View style={styles.statusRow}>
									<Text style={styles.statusLabel}>ID :</Text>
									<Text style={styles.statusValue}>{transactionResult.transaction_id}</Text>
								</View>
								<View style={styles.statusRow}>
									<Text style={styles.statusLabel}>Statut :</Text>
									<Text style={[
										styles.statusValue,
										transactionResult.status === 'completed'
											? styles.statusSuccess
											: transactionResult.status === 'failed'
												? styles.statusFailed
												: styles.statusPending
									]}>
										{transactionResult.status === 'completed' ? 'Terminé, Merci' : transactionResult.status === 'failed' ? 'Échoué' : 'En attente'}
									</Text>
								</View>
								<View style={styles.statusRow}>
									<Text style={styles.statusLabel}>Montant :</Text>
									<Text style={styles.statusValue}>{transactionResult.amount} CDF</Text>
								</View>
								<View style={styles.statusRow}>
									<Text style={styles.statusLabel}>Nom :</Text>
									<Text style={styles.statusValue}>{transactionResult.surname}</Text>
								</View>
								<View style={styles.statusRow}>
									<Text style={styles.statusLabel}>Téléphone :</Text>
									<Text style={styles.statusValue}>{transactionResult.phone}</Text>
								</View>
							</>
						)}
						<TouchableOpacity onPress={handleBackToForm} style={styles.backButton}>
							<Text style={styles.backButtonText}>Faire un autre don</Text>
						</TouchableOpacity>
					</View>
				) : (
					<View style={styles.formCard}>
						<TextInput
							style={styles.input}
							placeholder="Téléphone"
							value={phone}
							onChangeText={setPhone}
							keyboardType="phone-pad"
							placeholderTextColor="#888"
						/>
						<TextInput
							style={styles.input}
							placeholder="Nom"
							value={surname}
							onChangeText={setSurname}
							placeholderTextColor="#888"
						/>
						<TextInput
							style={styles.input}
							placeholder="Montant"
							value={amount}
							onChangeText={setAmount}
							keyboardType="numeric"
							placeholderTextColor="#888"
						/>
						<TouchableOpacity
							style={[styles.submitButton, loading && { opacity: 0.6 }]}
							onPress={handleSubmit}
							disabled={loading}
						>
							{loading ? (
								<ActivityIndicator color="#fff" />
							) : (
								<Text style={styles.submitButtonText}>Faire un don</Text>
							)}
						</TouchableOpacity>
					</View>
				)
			}


		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		backgroundColor: '#f3f4f6',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
	},
	logo: {
		width: 100,
		height: 100,
		marginBottom: 20,
		borderRadius: 20,
	},
	title: {
		fontSize: 28,
		marginBottom: 24,
		fontWeight: 'bold',
		color: '#2563eb',
		letterSpacing: 1,
	},
	formCard: {
		width: '100%',
		maxWidth: 400,
		backgroundColor: '#fff',
		borderRadius: 16,
		padding: 24,
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 2,
	},
	input: {
		width: '100%',
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 8,
		padding: 14,
		marginBottom: 18,
		fontSize: 16,
		backgroundColor: '#f9fafb',
	},
	submitButton: {
		backgroundColor: '#2563eb',
		paddingVertical: 14,
		borderRadius: 8,
		alignItems: 'center',
		marginTop: 8,
	},
	submitButtonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
		letterSpacing: 1,
	},
	resultCard: {
		width: '100%',
		maxWidth: 400,
		backgroundColor: '#fff',
		borderRadius: 16,
		padding: 28,
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 2,
		alignItems: 'center',
	},
	statusTitle: {
		fontSize: 22,
		fontWeight: 'bold',
		marginBottom: 18,
		color: '#2563eb',
	},
	statusRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		marginBottom: 10,
	},
	statusLabel: {
		fontWeight: '600',
		color: '#374151',
		width: 110,
	},
	statusValue: {
		fontWeight: '400',
		color: '#111827',
		flex: 1,
		textAlign: 'right',
	},
	statusSuccess: {
		color: '#16a34a',
		fontWeight: 'bold',
	},
	statusFailed: {
		color: '#dc2626',
		fontWeight: 'bold',
	},
	statusPending: {
		color: '#f59e42',
		fontWeight: 'bold',
	},
	errorText: {
		color: '#dc2626',
		fontSize: 16,
		marginBottom: 12,
		textAlign: 'center',
	},
	backButton: {
		marginTop: 24,
		backgroundColor: '#2563eb',
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
	},
	backButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
