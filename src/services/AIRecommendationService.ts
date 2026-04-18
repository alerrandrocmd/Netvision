/**
 * AIRecommendationService.ts
 *
 * This service evaluates the network conditions such as signal strength and device count to make recommendations about potential network congestion.
 */

class AIRecommendationService {
  /**
   * Analyzes network conditions and provides recommendations.
   * @param signalStrength - The signal strength value (0 to 100).
   * @param deviceCount - The number of devices connected to the network.
   * @returns A recommendation string regarding network congestion.
   */
  static analyze(signalStrength: number, deviceCount: number): string {
    let recommendation = 'Network is healthy.';

    // Evaluate signal strength
    if (signalStrength < 30) {
      recommendation = 'Poor signal strength detected! Consider relocating the router.';
    } else if (signalStrength < 50) {
      recommendation = 'Signal strength is moderate, you might experience some congestion.';
    }

    // Evaluate device count
    if (deviceCount > 50) {
      recommendation += ' High number of devices may lead to congestion.';
    } else if (deviceCount > 20) {
      recommendation += ' Consider minimizing the number of devices for optimal performance.';
    }

    return recommendation;
  }
}

export default AIRecommendationService;