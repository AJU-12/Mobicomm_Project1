// Initialize Stripe with test publishable key
const stripe = Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');
const elements = stripe.elements();
let cardElement;

// Create card element
function initializeStripeElements() {
    // Create card element if it doesn't exist
    if (!cardElement) {
        cardElement = elements.create('card', {
            style: {
                base: {
                    color: '#32325d',
                    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                    fontSmoothing: 'antialiased',
                    fontSize: '16px',
                    '::placeholder': {
                        color: '#aab7c4'
                    }
                },
                invalid: {
                    color: '#fa755a',
                    iconColor: '#fa755a'
                }
            }
        });
        
        // Mount the card element
        const container = document.getElementById('card-element-container');
        if (container) {
            cardElement.mount('#card-element-container');
            
            // Handle validation errors
            cardElement.on('change', function(event) {
                const displayError = document.getElementById('card-errors');
                if (displayError) {
                    if (event.error) {
                        displayError.textContent = event.error.message;
                    } else {
                        displayError.textContent = '';
                    }
                }
            });
        }
    }
    
    // Add processStripePayment function to window object
    window.processStripePayment = async function(transactionId, amount, userId, selectedPlanId) {
        try {
            // Create payment method
            const result = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: {
                    name: document.getElementById('card-holder-name').value
                }
            });
            
            if (result.error) {
                // Show error to customer
                const errorElement = document.getElementById('card-errors');
                errorElement.textContent = result.error.message;
                return;
            }
            
            // Show payment processing popup
            showPaymentSuccessPopup();
            
            console.log('Payment method created:', result.paymentMethod.id);
            
        } catch (error) {
            console.error('Error processing payment:', error);
            document.querySelector(".payment-success-content").innerHTML = `
                <h3 style="color: red;">Payment Failed</h3>
                <p>Something went wrong. Please try again.</p>
                <button class="home-button" onclick="window.location.href='paymentGateway.html'">Try Again</button>
            `;
        }
    };
}