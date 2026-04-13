// ==========================================
// MY TRAVEL — Collaborative Data Service
// ==========================================

import supabase from './supabase.js';

class DataService {
  /**
   * ---- Trips & Participants ----
   */

  async getTrips() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        participants:trip_participants(*)
      `)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('DataService: Erro ao carregar viagens:', error.message || error);
      return [];
    }
    return data;
  }

  async getTrip(id) {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        participants:trip_participants(
          *,
          profile:profiles(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.warn('DataService: Could not fetch trip:', error.message);
      return null;
    }
    return data;
  }

  async createTrip(tripData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('trips')
      .insert({
        ...tripData,
        owner_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Add owner as participant
    await supabase.from('trip_participants').insert({
      trip_id: data.id,
      user_id: user.id,
      role: 'owner'
    });

    return data;
  }

  async joinTripByToken(token) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Acesso negado. Faça login primeiro.');

    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('id')
      .eq('share_token', token)
      .single();

    if (tripErr || !trip) throw new Error('Link de convite inválido ou expirado.');

    const { error: joinErr } = await supabase
      .from('trip_participants')
      .insert({
        trip_id: trip.id,
        user_id: user.id,
        role: 'participant'
      });

    if (joinErr && joinErr.code !== '23505') throw joinErr; // Ignore if already joined

    return trip.id;
  }

  /**
   * ---- Itinerary (Activities) ----
   */

  async _ensureProfile(user) {
    if (!user) return;
    
    try {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        console.log('DataService: Creating missing profile for', user.email);
        const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random`
        });
        if (error) console.error('DataService: Profile creation error:', error.message);
      }
    } catch (e) {
      console.error('DataService: Profile check failed:', e);
    }
  }

  async createTrip(tripData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
    }

    // 1. Ensure profile exists first
    await this._ensureProfile(user);

    // 2. Create the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        ...tripData,
        owner_id: user.id
      })
      .select()
      .single();

    if (tripError) {
      console.error('DataService: Create Trip Error:', tripError);
      throw new Error(`Erro ao criar viagem: ${tripError.message || 'Erro no banco de dados'}${tripError.details ? ` (${tripError.details})` : ''}`);
    }

    // 3. Add owner as participant
    const { error: partError } = await supabase.from('trip_participants').insert({
      trip_id: trip.id,
      user_id: user.id,
      role: 'owner'
    });

    if (partError) {
      console.warn('DataService: Participant addition failed:', partError.message);
      // We don't throw here to avoid blocking the user if the trip was already created
    }

    return trip;
  }

  async getActivities(tripId) {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        creator:profiles(*)
      `)
      .eq('trip_id', tripId)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) return [];
    return data;
  }

  async createActivity(activityData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await this._ensureProfile(user);

    const { data, error } = await supabase
      .from('activities')
      .insert({
        ...activityData,
        creator_id: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateActivity(id, activityData) {
    const { data, error } = await supabase
      .from('activities')
      .update(activityData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteActivity(id) {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * ---- Flights ----
   */

  async getFlights(tripId) {
    const { data, error } = await supabase
      .from('flights')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('trip_id', tripId)
      .order('departure_time', { ascending: true });

    if (error) return [];
    return data;
  }

  async createFlight(flightData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await this._ensureProfile(user);

    const { data, error } = await supabase
      .from('flights')
      .insert({
        ...flightData,
        user_id: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * ---- Realtime Helpers ----
   */

  subscribeToTripChanges(tripId, callback) {
    return supabase
      .channel(`trip-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities', filter: `trip_id=eq.${tripId}` }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flights', filter: `trip_id=eq.${tripId}` }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_participants', filter: `trip_id=eq.${tripId}` }, callback)
      .subscribe();
  }
}

export const dataService = new DataService();
export default dataService;
