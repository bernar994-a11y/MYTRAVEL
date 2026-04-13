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

  async updateTrip(id, tripData) {
    const { data, error } = await supabase
      .from('trips')
      .update(tripData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * ---- Itinerary (Activities) ----
   */

  async _ensureProfile(user) {
    if (!user) return;
    
    console.log('🔍 [DataService] Verificando integridade do perfil...');
    try {
      // Check if profile exists
      const { data: profile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ [DataService] Erro ao verificar perfil:', checkError);
      }

      if (!profile) {
        console.log('🚀 [DataService] Criando perfil persistente para:', user.email);
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random`
        }, { onConflict: 'id' });
        
        if (upsertError) {
          console.error('❌ [DataService] Falha crítica na criação do perfil:', upsertError.message);
          throw upsertError;
        }
      }
    } catch (e) {
      console.error('❌ [DataService] Erro na rotina de perfil:', e.message);
    }
  }

  async createTrip(tripData) {
    console.group('🛠️ [DataService] Fluxo de Criação de Viagem');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ [Auth] Usuário não identificado');
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // 1. Persistência de Perfil (Garantia de FK)
      await this._ensureProfile(user);

      // 2. Inserção da Viagem
      const payload = { ...tripData, owner_id: user.id };
      console.log('📡 Enviando Payload:', payload);

      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert(payload)
        .select()
        .single();

      if (tripError) {
        console.group('❌ [Postgres] Erro de Inserção (Trips)');
        console.error('Mensagem:', tripError.message);
        console.error('Código:', tripError.code);
        console.error('Detalhes:', tripError.details);
        console.error('Dica:', tripError.hint);
        console.groupEnd();
        throw new Error(`Erro no Banco: ${tripError.message}`);
      }

      console.log('✅ Viagem criada com ID:', trip.id);

      // 3. Registro de Participante (Dono)
      const { error: partError } = await supabase.from('trip_participants').insert({
        trip_id: trip.id,
        user_id: user.id,
        role: 'owner'
      });

      if (partError) {
        console.warn('⚠️ [DataService] Dono não pôde ser vinculado como participante:', partError.message);
      }

      console.groupEnd();
      return trip;
    } catch (err) {
      console.groupEnd();
      throw err;
    }
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
   * ---- Reservations ----
   */

  async getReservations(tripId) {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('trip_id', tripId)
      .order('start_date', { ascending: true });

    if (error) return [];
    return data;
  }

  async createReservation(resData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await this._ensureProfile(user);

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        ...resData,
        user_id: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateReservation(id, resData) {
    const { data, error } = await supabase
      .from('reservations')
      .update(resData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteReservation(id) {
    const { error } = await supabase.from('reservations').delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * ---- Realtime Helpers ----
   */

  subscribeToTripChanges(tripId, callback) {
    return supabase
      .channel(`trip-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities', filter: `trip_id=eq.${tripId}` }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flights', filter: `trip_id=eq.${tripId}` }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `trip_id=eq.${tripId}` }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_participants', filter: `trip_id=eq.${tripId}` }, callback)
      .subscribe();
  }
}

export const dataService = new DataService();
export default dataService;
